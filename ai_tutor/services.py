from django.utils import timezone
from datetime import timedelta
from .models import Subscription, AIChatUsage
from django.db.models import Sum, Count


class SubscriptionService:
    """Service for managing subscriptions and usage limits"""
    
    @staticmethod
    def get_or_create_subscription(user):
        """Get or create a subscription for a user"""
        subscription, created = Subscription.objects.get_or_create(
            user=user,
            defaults={
                'tier': Subscription.SubscriptionTier.FREE,
                'is_active': True
            }
        )
        return subscription
    
    @staticmethod
    def check_subscription_access(user):
        """Check if user has active subscription"""
        try:
            subscription = user.subscription
            if subscription.is_valid:
                return True, subscription
        except Subscription.DoesNotExist:
            pass
        
        # Create free subscription if doesn't exist
        subscription = SubscriptionService.get_or_create_subscription(user)
        return subscription.is_valid, subscription
    
    @staticmethod
    def get_current_month_usage(user):
        """Get current month's usage statistics"""
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        usage = AIChatUsage.objects.filter(
            user=user,
            created_at__gte=month_start
        ).aggregate(
            total_chats=Count('id'),
            total_tokens=Sum('tokens_used')
        )
        
        return {
            'chats_used': usage['total_chats'] or 0,
            'tokens_used': usage['total_tokens'] or 0,
            'month_start': month_start
        }
    
    @staticmethod
    def check_usage_limits(user):
        """Check if user has exceeded their usage limits"""
        subscription = SubscriptionService.get_or_create_subscription(user)
        usage = SubscriptionService.get_current_month_usage(user)
        limits = subscription.get_limits()
        
        # Check chat limit
        chat_limit = limits['monthly_chats']
        if chat_limit > 0 and usage['chats_used'] >= chat_limit:
            return False, {
                'exceeded': True,
                'limit_type': 'chats',
                'used': usage['chats_used'],
                'limit': chat_limit,
                'message': f'You have reached your monthly chat limit of {chat_limit}. Please upgrade your subscription for more chats.'
            }
        
        # Check token limit
        token_limit = limits['monthly_tokens']
        if token_limit > 0 and usage['tokens_used'] >= token_limit:
            return False, {
                'exceeded': True,
                'limit_type': 'tokens',
                'used': usage['tokens_used'],
                'limit': token_limit,
                'message': f'You have reached your monthly token limit of {token_limit:,}. Please upgrade your subscription for more tokens.'
            }
        
        return True, {
            'exceeded': False,
            'usage': usage,
            'limits': limits,
            'remaining_chats': chat_limit - usage['chats_used'] if chat_limit > 0 else 'unlimited',
            'remaining_tokens': token_limit - usage['tokens_used'] if token_limit > 0 else 'unlimited'
        }
    
    @staticmethod
    def estimate_tokens(text):
        """Estimate token count (rough approximation: 1 token ≈ 4 characters)"""
        return len(text) // 4
    
    @staticmethod
    def record_usage(user, lesson, question, response, tokens_used=None):
        """Record AI chat usage"""
        if tokens_used is None:
            # Estimate tokens from question + response
            tokens_used = SubscriptionService.estimate_tokens(question + response)
        
        AIChatUsage.objects.create(
            user=user,
            lesson=lesson,
            question=question,
            response=response,
            tokens_used=tokens_used
        )
