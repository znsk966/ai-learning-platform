from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from .models import Subscription, SubscriptionPlan, AIChatUsage
from .serializers import (
    SubscriptionSerializer,
    SubscriptionPlanSerializer,
    AIChatUsageSerializer,
    UsageStatsSerializer
)
from .services import SubscriptionService
from payments.models import PaymentTransaction


class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing subscription details"""
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current subscription"""
        subscription = SubscriptionService.get_or_create_subscription(request.user)
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def usage(self, request):
        """Get current usage statistics"""
        subscription = SubscriptionService.get_or_create_subscription(request.user)
        usage = SubscriptionService.get_current_month_usage(request.user)
        limits = subscription.get_limits()
        
        can_use, limit_info = SubscriptionService.check_usage_limits(request.user)
        
        stats = {
            'chats_used': usage['chats_used'],
            'tokens_used': usage['tokens_used'],
            'chats_remaining': limit_info.get('remaining_chats', 'unlimited'),
            'tokens_remaining': limit_info.get('remaining_tokens', 'unlimited'),
            'chat_limit': limits['monthly_chats'],
            'token_limit': limits['monthly_tokens'],
            'month_start': usage['month_start']
        }
        
        serializer = UsageStatsSerializer(stats)
        return Response(serializer.data)


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing available subscription plans"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]


class AIChatUsageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing AI chat usage history"""
    serializer_class = AIChatUsageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIChatUsage.objects.filter(user=self.request.user)


class CreateSubscriptionView(APIView):
    """Create or upgrade a subscription"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        plan_id = request.data.get('plan_id')
        
        if not plan_id:
            return Response(
                {'detail': 'plan_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            plan = SubscriptionPlan.objects.get(pk=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'detail': 'Subscription plan not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = request.user
        subscription, created = Subscription.objects.get_or_create(
            user=user,
            defaults={
                'tier': plan.tier,
                'is_active': True,
                'monthly_chat_limit': plan.monthly_chat_limit,
                'monthly_token_limit': plan.monthly_token_limit
            }
        )
        
        if not created:
            # Update existing subscription
            subscription.tier = plan.tier
            subscription.is_active = True
            subscription.monthly_chat_limit = plan.monthly_chat_limit
            subscription.monthly_token_limit = plan.monthly_token_limit
        
        # Set expiration based on billing period
        if plan.billing_period == 'MONTHLY':
            subscription.expires_at = timezone.now() + timedelta(days=30)
        elif plan.billing_period == 'YEARLY':
            subscription.expires_at = timezone.now() + timedelta(days=365)
        
        subscription.save()
        
        # Sync Profile.is_premium automatically (via signal)
        # The signal will update profile.is_premium based on subscription
        
        # Create payment transaction as PENDING until real payment confirmation
        payment_status = PaymentTransaction.PaymentStatus.PENDING
        if getattr(settings, 'DEMO_MODE', False) or plan.price == 0:
            payment_status = PaymentTransaction.PaymentStatus.COMPLETED

        PaymentTransaction.objects.create(
            user=user,
            module=None,  # Subscription is not tied to a module
            amount=plan.price,
            currency=plan.currency,
            status=payment_status,
            payment_method=PaymentTransaction.PaymentMethod.STRIPE if plan.price > 0 else PaymentTransaction.PaymentMethod.FREE,
            completed_at=timezone.now() if payment_status == PaymentTransaction.PaymentStatus.COMPLETED else None
        )

        # Only activate paid subscriptions after payment confirmation (unless DEMO_MODE)
        if plan.price > 0 and not getattr(settings, 'DEMO_MODE', False):
            subscription.is_active = False
            subscription.save()
        
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
