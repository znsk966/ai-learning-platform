import json
import logging
import time

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from content.models import Lesson

from .services import SubscriptionService

logger = logging.getLogger('ai_tutor')

# Try to import Google Gemini (newer google-genai library for secure proxy pattern)
# This ensures the API key stays on the server and is never exposed to the frontend
try:
    from google import genai
    from google.genai import types
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
    types = None

if not GEMINI_AVAILABLE:
    logger.warning(
        "AI tutor: Gemini is not available (library missing or GEMINI_API_KEY unset). "
        "Requests will fail with HTTP 503 unless AI_TUTOR_ALLOW_SIMULATED is enabled."
    )

# Server-side caps for conversation memory
MAX_HISTORY_TURNS = 10
MAX_HISTORY_CHARS = 8000
# Cap on lesson reading text injected into the tutor context (READ lessons only)
MAX_LESSON_TEXT_CHARS = 6000


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
        diy_context = request.data.get('diy_context', '')  # Optional

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

        # --- 4. Build prompt (system instruction + multi-turn contents) ---
        ai_config = request.data.get('ai_config', {})
        history = self._sanitize_history(request.data.get('history', []))

        system_instruction = self._build_system_instruction(lesson, diy_context, ai_config)
        contents = self._build_contents(history, user_question)

        # --- 5. Get AI response (honest failure handling) ---
        if GEMINI_AVAILABLE:
            try:
                ai_response = self._get_gemini_response(system_instruction, contents)
            except Exception as e:
                logger.error("Gemini API error: %s", e)
                if settings.AI_TUTOR_ALLOW_SIMULATED:
                    ai_response = self._get_simulated_response(lesson, user_question)
                else:
                    return Response({
                        "error": "The AI tutor is temporarily unavailable. Please try again shortly.",
                        "tutor_unavailable": True
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        elif settings.AI_TUTOR_ALLOW_SIMULATED:
            logger.info("GEMINI_AVAILABLE is False - using simulated response (AI_TUTOR_ALLOW_SIMULATED enabled)")
            ai_response = self._get_simulated_response(lesson, user_question)
        else:
            logger.error("AI tutor request failed: Gemini unavailable and simulated responses disabled.")
            return Response({
                "error": "The AI tutor is temporarily unavailable. Please try again shortly.",
                "tutor_unavailable": True
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Estimate tokens used (prompt context + history + question + response)
        prompt_text = system_instruction + self._contents_to_text(contents)
        tokens_used = SubscriptionService.estimate_tokens(prompt_text + ai_response)

        # --- 6. Record Usage (only on a successful response) ---
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

    @staticmethod
    def _coerce_config(ai_config):
        """Coerce ai_config into a dict, tolerating JSON strings and bad input."""
        if isinstance(ai_config, str):
            try:
                ai_config = json.loads(ai_config)
            except (json.JSONDecodeError, TypeError, ValueError):
                return {}
        return ai_config if isinstance(ai_config, dict) else {}

    def _sanitize_history(self, history):
        """
        Validate and cap client-supplied conversation history.

        Accepts a list of {"role": "user"|"model", "content": "..."} turns.
        Drops malformed entries, keeps the last MAX_HISTORY_TURNS turns, and
        enforces a total character budget (trimming oldest-first).
        """
        if not isinstance(history, list):
            return []

        cleaned = []
        for turn in history:
            if not isinstance(turn, dict):
                continue
            role = turn.get('role')
            content = turn.get('content')
            if role not in ('user', 'model'):
                continue
            if not isinstance(content, str) or not content.strip():
                continue
            cleaned.append({'role': role, 'content': content})

        # Keep only the most recent turns
        cleaned = cleaned[-MAX_HISTORY_TURNS:]

        # Enforce a total character budget, trimming oldest-first
        total = sum(len(t['content']) for t in cleaned)
        while cleaned and total > MAX_HISTORY_CHARS:
            removed = cleaned.pop(0)
            total -= len(removed['content'])

        return cleaned

    def _build_system_instruction(self, lesson, diy_context, ai_config):
        """Build the tutoring persona + lesson context + rules as a system instruction."""
        ai_config = self._coerce_config(ai_config)

        parts = [
            f"You are an expert AI tutor helping a student with the lesson: '{lesson.title}'.",
        ]

        # Lesson-specific context (server-side persona/instruction, not shown to the learner)
        if lesson.ai_tutor_initial_prompt:
            parts.append(f"Lesson Context: {lesson.ai_tutor_initial_prompt}")

        if ai_config.get('subject'):
            parts.append(f"Subject: {ai_config['subject']}")
        if ai_config.get('difficulty_level'):
            parts.append(f"Difficulty Level: {ai_config['difficulty_level']}")
        if ai_config.get('teaching_style'):
            parts.append(f"Teaching Style: {ai_config['teaching_style']}")
        if ai_config.get('preferred_explanation_length'):
            parts.append(f"Keep explanations to: {ai_config['preferred_explanation_length']}.")
        if ai_config.get('max_hints_per_question'):
            parts.append(
                f"Offer at most {ai_config['max_hints_per_question']} hints toward any single "
                "quiz question, and never state or confirm the correct answer."
            )

        # Inject the reading material for READ lessons only. Never inject quiz
        # questions or answer choices — the tutor must not see the answer key.
        if lesson.lesson_type == Lesson.LessonType.READING and lesson.text_content:
            reading = lesson.text_content[:MAX_LESSON_TEXT_CHARS]
            parts.append(
                "The following is the lesson reading material the student is studying. "
                "Use it to ground your answers:\n"
                f"{reading}"
            )

        if diy_context:
            parts.append(f"Additional Context: {diy_context}")

        parts.append("""
Please provide helpful, educational responses that:
1. Directly address the student's question
2. Use clear, step-by-step explanations
3. Encourage learning and understanding
4. Are appropriate for the specified difficulty level
5. Maintain a supportive and encouraging tone
""")

        return "\n\n".join(parts)

    def _build_contents(self, history, user_question):
        """Build the multi-turn contents list from sanitized history + the new question."""
        contents = []
        for turn in history:
            contents.append({'role': turn['role'], 'parts': [{'text': turn['content']}]})
        contents.append({'role': 'user', 'parts': [{'text': user_question}]})
        return contents

    @staticmethod
    def _contents_to_text(contents):
        """Flatten contents into plain text (used only for token estimation)."""
        chunks = []
        for turn in contents:
            for part in turn.get('parts', []):
                chunks.append(part.get('text', ''))
        return "\n".join(chunks)

    def _get_gemini_response(self, system_instruction, contents):
        """
        Get response from Google Gemini API using secure proxy pattern.
        API key is stored server-side only - never exposed to frontend.

        Uses google-genai's GenerateContentConfig(system_instruction=...) plus a
        multi-turn `contents` list of {"role", "parts": [{"text"}]} turns.
        """
        if not GEMINI_AVAILABLE or not GEMINI_API_KEY:
            raise Exception("Gemini API not available or API key not configured")

        # Initialize client with API key (server-side only)
        client = genai.Client(api_key=GEMINI_API_KEY)

        config = types.GenerateContentConfig(system_instruction=system_instruction)

        # Try newer model names (as of 2025)
        model_names = [
            'gemini-2.5-flash',       # Latest stable flash model
            'gemini-2.0-flash',       # Alternative flash model
            'gemini-flash-latest',    # Latest flash (auto-updates)
            'gemini-2.5-pro',         # Pro model
            'gemini-pro-latest',      # Latest pro (auto-updates)
        ]

        last_error = None
        for model_name in model_names:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                logger.info("Successfully used model: %s", model_name)
                return response.text
            except Exception as e:
                logger.warning("Error with model %s: %s", model_name, e)
                last_error = e
                continue

        raise Exception(f"All Gemini models failed. Last error: {last_error}")

    def _get_simulated_response(self, lesson, user_question):
        """Fallback simulated response (dev/tests only, gated by AI_TUTOR_ALLOW_SIMULATED)."""
        time.sleep(1)  # Simulate processing time
        return (
            f"Of course! Let's think about your question regarding '{lesson.title}'. "
            "A good first step would be to check your assumptions about the topic. "
            "Have you considered...?"
        )
