from rest_framework import serializers

from .models import AIChatUsage, Subscription, SubscriptionPlan


class SubscriptionSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'tier', 'tier_display', 'started_at', 'expires_at',
            'is_active', 'auto_renew', 'is_valid', 'is_expired',
            'monthly_chat_limit', 'monthly_token_limit'
        ]
        read_only_fields = ['started_at']


class AIChatUsageSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = AIChatUsage
        fields = [
            'id', 'lesson', 'lesson_title', 'question', 'response',
            'tokens_used', 'created_at'
        ]
        read_only_fields = ['created_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    billing_period_display = serializers.CharField(source='get_billing_period_display', read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'tier', 'tier_display', 'price', 'currency',
            'billing_period', 'billing_period_display',
            'monthly_chat_limit', 'monthly_token_limit', 'features', 'is_active'
        ]


class UsageStatsSerializer(serializers.Serializer):
    """Serializer for usage statistics"""
    chats_used = serializers.IntegerField()
    tokens_used = serializers.IntegerField()
    chats_remaining = serializers.CharField()
    tokens_remaining = serializers.CharField()
    chat_limit = serializers.IntegerField()
    token_limit = serializers.IntegerField()
    month_start = serializers.DateTimeField()
