import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import time
import json
from django.conf import settings

logger = logging.getLogger('ai_tutor')

# Try to import Google Gemini (newer google-genai library for secure proxy pattern)
# This ensures the API key stays on the server and is never exposed to the frontend
try:
    from google import genai
    GEMINI_AVAILABLE = True
    # API key is loaded from environment variables (settings.GEMINI_API_KEY)
    # Never exposed to frontend - 100% secure proxy pattern
    if hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != 'your-gemini-api-key-here':
        GEMINI_API_KEY = settings.GEMINI_API_KEY
    else:
        GEMINI_AVAILABLE = False
        GEMINI_API_KEY = None
except ImportError:
    GEMINI_AVAILABLE = False
    GEMINI_API_KEY = None

from content.models import Lesson
from .models import Subscription, AIChatUsage
from .services import SubscriptionService

class AIAskView(APIView):
    """
    The central endpoint for handling all AI-related questions from users.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        
        # --- 1. Get data from the frontend request ---
        lesson_id = request.data.get('lesson_id')
        user_question = request.data.get('user_question')
        diy_context = request.data.get('diy_context', '') # Optional

        if not lesson_id or not user_question:
            return Response(
                {"error": "A lesson_id and user_question are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(user_question) > 2000:
            return Response(
                {"error": "Question must be 2000 characters or fewer."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({"error": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)

        # --- 2. Check User's Subscription Status ---
        has_access, subscription = SubscriptionService.check_subscription_access(user)
        if not has_access:
            return Response({
                "error": "Your subscription has expired. Please renew to continue using the AI Tutor.",
                "is_premium_response": False,
                "subscription_required": True
            }, status=status.HTTP_403_FORBIDDEN)
        
        # --- 3. Check Usage Limits ---
        can_use, limit_info = SubscriptionService.check_usage_limits(user)
        if not can_use:
            return Response({
                "error": limit_info['message'],
                "is_premium_response": False,
                "limit_exceeded": True,
                "limit_info": limit_info
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # --- 4. Real AI Logic ---
        ai_config = request.data.get('ai_config', {})
        
        # Build the AI prompt
        prompt = self._build_ai_prompt(lesson, user_question, diy_context, ai_config)
        
        # Get AI response
        tokens_used = 0
        if GEMINI_AVAILABLE:
            logger.debug("GEMINI_AVAILABLE: %s", GEMINI_AVAILABLE)
            logger.debug("API Key configured: %s", bool(hasattr(settings, 'GEMINI_API_KEY') and settings.GEMINI_API_KEY != 'your-gemini-api-key-here'))
            try:
                ai_response = self._get_gemini_response(prompt)
                # Estimate tokens used (prompt + response)
                tokens_used = SubscriptionService.estimate_tokens(prompt + ai_response)
                logger.info("Successfully got Gemini response")
            except Exception as e:
                error_msg = str(e)
                logger.error("Gemini API error: %s", e)
                
                # Check if it's an API key issue
                if 'leaked' in error_msg.lower() or '403' in error_msg or 'invalid' in error_msg.lower() or 'API_KEY_HTTP_REFERRER_BLOCKED' in error_msg:
                    if 'API_KEY_HTTP_REFERRER_BLOCKED' in error_msg:
                        logger.warning("API Key has HTTP referrer restrictions. Update restrictions in Google Cloud Console.")
                    else:
                        logger.warning("API Key issue detected. Using simulated response.")
                    ai_response = self._get_simulated_response(lesson, user_question)
                    # Add a note that this is a simulated response
                    ai_response = f"[Note: Using simulated response due to API key restrictions. Please update API key restrictions in Google Cloud Console for server-side usage.]\n\n{ai_response}"
                else:
                    ai_response = self._get_simulated_response(lesson, user_question)
                
                tokens_used = SubscriptionService.estimate_tokens(prompt + ai_response)
        else:
            logger.info("GEMINI_AVAILABLE is False - using simulated response")
            ai_response = self._get_simulated_response(lesson, user_question)
            tokens_used = SubscriptionService.estimate_tokens(prompt + ai_response)
        
        # --- 5. Record Usage ---
        SubscriptionService.record_usage(
            user=user,
            lesson=lesson,
            question=user_question,
            response=ai_response,
            tokens_used=tokens_used
        )
        
        # Get updated usage info (after recording usage)
        usage = SubscriptionService.get_current_month_usage(user)
        subscription = SubscriptionService.get_or_create_subscription(user)
        limits = subscription.get_limits()
        
        # Calculate remaining limits
        chat_limit = limits['monthly_chats']
        token_limit = limits['monthly_tokens']
        remaining_chats = chat_limit - usage['chats_used'] if chat_limit > 0 else 'unlimited'
        remaining_tokens = token_limit - usage['tokens_used'] if token_limit > 0 else 'unlimited'
        
        usage_info = {
            "chats_used": usage['chats_used'],
            "tokens_used": usage['tokens_used'],
            "remaining_chats": remaining_chats,
            "remaining_tokens": remaining_tokens,
            "tokens_used_this_request": tokens_used
        }
        
        return Response({
            "ai_response": ai_response,
            "is_premium_response": True,
            "usage_info": usage_info
        })

    def _build_ai_prompt(self, lesson, user_question, diy_context, ai_config):
        """Build a comprehensive prompt for the AI tutor."""
        
        # Base context
        prompt_parts = [
            f"You are an expert AI tutor helping a student with the lesson: '{lesson.title}'.",
        ]
        
        # Add lesson-specific context
        if lesson.ai_tutor_initial_prompt:
            prompt_parts.append(f"Lesson Context: {lesson.ai_tutor_initial_prompt}")
        
        # Add AI configuration if available
        if ai_config:
            if isinstance(ai_config, str):
                try:
                    ai_config = json.loads(ai_config)
                except:
                    ai_config = {}
            
            if ai_config.get('subject'):
                prompt_parts.append(f"Subject: {ai_config['subject']}")
            if ai_config.get('difficulty_level'):
                prompt_parts.append(f"Difficulty Level: {ai_config['difficulty_level']}")
            if ai_config.get('teaching_style'):
                prompt_parts.append(f"Teaching Style: {ai_config['teaching_style']}")
        
        # Add user context
        if diy_context:
            prompt_parts.append(f"Additional Context: {diy_context}")
        
        # Add the user's question
        prompt_parts.append(f"\nStudent Question: {user_question}")
        
        # Add instructions
        prompt_parts.append("""
Please provide a helpful, educational response that:
1. Directly addresses the student's question
2. Uses clear, step-by-step explanations
3. Encourages learning and understanding
4. Is appropriate for the specified difficulty level
5. Maintains a supportive and encouraging tone
""")
        
        return "\n\n".join(prompt_parts)

    def _get_gemini_response(self, prompt):
        """
        Get response from Google Gemini API using secure proxy pattern.
        API key is stored server-side only - never exposed to frontend.
        """
        if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
            raise Exception("Gemini API not available or API key not configured")
        
        # Initialize client with API key (server-side only)
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Try newer model names (as of 2025)
        model_names = [
            'gemini-2.5-flash',      # Latest stable flash model
            'gemini-2.0-flash',      # Alternative flash model
            'gemini-flash-latest',    # Latest flash (auto-updates)
            'gemini-2.5-pro',        # Pro model
            'gemini-pro-latest',      # Latest pro (auto-updates)
        ]
        
        last_error = None
        for model_name in model_names:
            try:
                # Use the newer Client API pattern
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                logger.info("Successfully used model: %s", model_name)
                return response.text
            except Exception as e:
                logger.warning("Error with model %s: %s", model_name, e)
                last_error = e
                continue
        
        # If all models failed, try to list available models for debugging
        try:
            models = client.models.list()
            available_models = [
                model.name for model in models 
                if hasattr(model, 'supported_generation_methods') and 
                'generateContent' in model.supported_generation_methods
            ]
            logger.info("Available models with generateContent: %s", available_models)
        except Exception as debug_error:
            logger.warning("Could not list models for debugging: %s", debug_error)
        
        raise Exception(f"All Gemini models failed. Last error: {last_error}")

    def _get_simulated_response(self, lesson, user_question):
        """Fallback simulated response."""
        time.sleep(1)  # Simulate processing time
        return f"Of course! Let's think about your question regarding '{lesson.title}'. A good first step would be to check your assumptions about the topic. Have you considered...?"

