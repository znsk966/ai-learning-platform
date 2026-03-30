from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Subscription(models.Model):
    """User subscription for AI tutor access"""
    
    class SubscriptionTier(models.TextChoices):
        FREE = 'FREE', 'Free'
        BASIC = 'BASIC', 'Basic'
        PREMIUM = 'PREMIUM', 'Premium'
        PRO = 'PRO', 'Pro'
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    tier = models.CharField(
        max_length=10,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.FREE
    )
    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    auto_renew = models.BooleanField(default=False)
    
    # Usage limits based on tier
    monthly_chat_limit = models.PositiveIntegerField(default=0)  # 0 = unlimited
    monthly_token_limit = models.PositiveIntegerField(default=0)  # 0 = unlimited
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_tier_display()}"
    
    @property
    def is_expired(self):
        """Check if subscription has expired"""
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if subscription is active and not expired"""
        return self.is_active and not self.is_expired
    
    def get_limits(self):
        """Get usage limits for this subscription tier"""
        limits = {
            Subscription.SubscriptionTier.FREE: {
                'monthly_chats': 5,
                'monthly_tokens': 10000,  # ~10k tokens
            },
            Subscription.SubscriptionTier.BASIC: {
                'monthly_chats': 50,
                'monthly_tokens': 100000,  # ~100k tokens
            },
            Subscription.SubscriptionTier.PREMIUM: {
                'monthly_chats': 200,
                'monthly_tokens': 500000,  # ~500k tokens
            },
            Subscription.SubscriptionTier.PRO: {
                'monthly_chats': 0,  # Unlimited
                'monthly_tokens': 0,  # Unlimited
            },
        }
        return limits.get(self.tier, limits[Subscription.SubscriptionTier.FREE])


class AIChatUsage(models.Model):
    """Track AI chat usage for billing and limits"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_chat_usage'
    )
    lesson = models.ForeignKey(
        'content.Lesson',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    question = models.TextField()
    response = models.TextField(blank=True)
    tokens_used = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at.date()}"


class SubscriptionPlan(models.Model):
    """Available subscription plans"""
    name = models.CharField(max_length=100)
    tier = models.CharField(
        max_length=10,
        choices=Subscription.SubscriptionTier.choices
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    billing_period = models.CharField(
        max_length=20,
        choices=[
            ('MONTHLY', 'Monthly'),
            ('YEARLY', 'Yearly'),
        ],
        default='MONTHLY'
    )
    monthly_chat_limit = models.PositiveIntegerField(default=0)  # 0 = unlimited
    monthly_token_limit = models.PositiveIntegerField(default=0)  # 0 = unlimited
    features = models.JSONField(default=dict, help_text="Dictionary of features included")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['price']
        unique_together = ['name', 'billing_period']  # Prevent duplicate plans
    
    def __str__(self):
        return f"{self.name} - {self.get_billing_period_display()}"
