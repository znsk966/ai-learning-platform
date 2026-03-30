import json
import logging

from django.conf import settings
from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.throttles import PaymentRateThrottle
from content.models import CourseEnrollment, Module

from .models import PaymentTransaction
from .serializers import (
    ConfirmPaymentSerializer,
    CreatePaymentIntentSerializer,
    LemonSqueezyCheckoutSerializer,
    PaymentTransactionSerializer,
)

logger = logging.getLogger('payments')


class PaymentTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing payment transactions (read-only for users)"""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Users can only see their own transactions"""
        return PaymentTransaction.objects.filter(user=self.request.user)


class CreatePaymentIntentView(APIView):
    """Create a payment intent for a course purchase"""
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = CreatePaymentIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        module_id = serializer.validated_data['module_id']
        module = Module.objects.get(pk=module_id)
        user = request.user

        # Check if user is already enrolled
        if CourseEnrollment.objects.filter(user=user, module=module, is_active=True).exists():
            return Response(
                {'detail': 'You are already enrolled in this course.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is premium and course is premium-only
        from content.models import Profile
        profile, _ = Profile.objects.get_or_create(user=user)
        if module.is_premium_only and not profile.is_premium:
            return Response(
                {'detail': 'This course requires a premium subscription.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # TODO: Integrate with Stripe/PayPal here
        # For now, we'll create a pending transaction
        # In production, you would:
        # 1. Create a PaymentIntent with Stripe
        # 2. Return the client_secret to the frontend
        # 3. Frontend confirms payment
        # 4. Webhook confirms and completes the transaction

        # Placeholder: Create a pending transaction
        transaction = PaymentTransaction.objects.create(
            user=user,
            module=module,
            amount=module.price,
            currency=module.currency,
            status=PaymentTransaction.PaymentStatus.PENDING,
            payment_method=PaymentTransaction.PaymentMethod.STRIPE
        )

        # For demo purposes, use transaction ID as payment_intent_id
        # In production, replace this with actual Stripe PaymentIntent creation
        # import stripe
        # stripe.api_key = settings.STRIPE_SECRET_KEY
        # intent = stripe.PaymentIntent.create(
        #     amount=int(module.price * 100),  # Convert to cents
        #     currency=module.currency.lower(),
        #     metadata={'module_id': module.id, 'user_id': user.id}
        # )
        # transaction.payment_intent_id = intent.id
        # transaction.save()

        # For demo: store transaction ID as payment_intent_id so we can find it later
        transaction.payment_intent_id = f"demo_{transaction.id}"
        transaction.save()

        return Response({
            'payment_intent_id': transaction.payment_intent_id,
            'client_secret': None,  # Would be returned from Stripe
            'transaction_id': transaction.id,
            'amount': float(transaction.amount),
            'currency': transaction.currency,
            'message': 'Payment intent created. In production, integrate with Stripe/PayPal.'
        }, status=status.HTTP_201_CREATED)


class ConfirmPaymentView(APIView):
    """Confirm a payment and enroll the user"""
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]

    @db_transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment_intent_id = serializer.validated_data['payment_intent_id']
        transaction_id = serializer.validated_data.get('transaction_id')

        try:
            # Find the transaction with select_for_update to prevent race conditions
            txn = None
            base_qs = PaymentTransaction.objects.select_for_update().filter(user=request.user)

            if transaction_id:
                txn = base_qs.filter(id=transaction_id).first()

            if not txn and payment_intent_id:
                txn = base_qs.filter(payment_intent_id=payment_intent_id).first()

            if not txn and payment_intent_id:
                try:
                    transaction_id_from_intent = payment_intent_id.replace('demo_', '')
                    txn = base_qs.filter(id=transaction_id_from_intent).first()
                except ValueError:
                    pass

            if not txn:
                raise PaymentTransaction.DoesNotExist

            # TODO: Verify payment with Stripe/PayPal
            # In production, verify the payment intent status with the provider

            if txn.status == PaymentTransaction.PaymentStatus.PENDING:
                txn.status = PaymentTransaction.PaymentStatus.COMPLETED
                txn.completed_at = timezone.now()
                txn.save()

                # Enroll the user
                enrollment, created = CourseEnrollment.objects.get_or_create(
                    user=request.user,
                    module=txn.module,
                    defaults={'is_active': True}
                )

                if not created:
                    enrollment.is_active = True
                    enrollment.save()

                return Response({
                    'status': 'success',
                    'message': 'Payment confirmed and enrollment successful.',
                    'enrollment_id': enrollment.id,
                    'transaction_id': txn.id
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'detail': f'Payment is already {txn.status.lower()}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except PaymentTransaction.DoesNotExist:
            return Response(
                {'detail': 'Payment transaction not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class EnrollFreeCourseView(APIView):
    """Enroll user in a free course"""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        module_id = request.data.get('module_id')

        if not module_id:
            return Response(
                {'detail': 'module_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            module = Module.objects.get(pk=module_id)
        except Module.DoesNotExist:
            return Response(
                {'detail': 'Module not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if course is free
        if not module.is_free:
            return Response(
                {'detail': 'This course is not free. Please use the payment endpoint.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is already enrolled
        enrollment, created = CourseEnrollment.objects.get_or_create(
            user=request.user,
            module=module,
            defaults={'is_active': True}
        )

        if not created:
            if enrollment.is_active:
                return Response(
                    {'detail': 'You are already enrolled in this course.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                enrollment.is_active = True
                enrollment.save()

        # Create a free payment transaction record
        PaymentTransaction.objects.create(
            user=request.user,
            module=module,
            amount=0.00,
            currency=module.currency,
            status=PaymentTransaction.PaymentStatus.COMPLETED,
            payment_method=PaymentTransaction.PaymentMethod.FREE,
            completed_at=timezone.now()
        )

        return Response({
            'status': 'success',
            'message': 'Successfully enrolled in free course.',
            'enrollment_id': enrollment.id
        }, status=status.HTTP_201_CREATED)


class LemonSqueezyCheckoutView(APIView):
    """Create a Lemon Squeezy checkout session for course or subscription purchase."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [PaymentRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = LemonSqueezyCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        variant_id = serializer.validated_data['variant_id']
        module_id = serializer.validated_data.get('module_id')
        plan_id = serializer.validated_data.get('plan_id')

        # Determine what we're purchasing
        module = None
        amount = 0
        currency = 'USD'

        if module_id:
            module = Module.objects.get(pk=module_id)
            if CourseEnrollment.objects.filter(user=user, module=module, is_active=True).exists():
                return Response(
                    {'detail': 'You are already enrolled in this course.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            amount = module.price
            currency = module.currency
        elif plan_id:
            from ai_tutor.models import SubscriptionPlan
            try:
                plan = SubscriptionPlan.objects.get(pk=plan_id, is_active=True)
            except SubscriptionPlan.DoesNotExist:
                return Response(
                    {'detail': 'Subscription plan not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            amount = plan.price
            currency = plan.currency

        # Create a PENDING transaction
        txn = PaymentTransaction.objects.create(
            user=user,
            module=module,
            amount=amount,
            currency=currency,
            status=PaymentTransaction.PaymentStatus.PENDING,
            payment_method=PaymentTransaction.PaymentMethod.LEMON_SQUEEZY,
            metadata={'plan_id': plan_id} if plan_id else None,
        )

        # Build custom data so the webhook can find our transaction
        custom_data = {
            'transaction_id': str(txn.id),
            'user_id': str(user.id),
        }
        if module_id:
            custom_data['module_id'] = str(module_id)
        if plan_id:
            custom_data['plan_id'] = str(plan_id)

        store_id = settings.LEMONSQUEEZY_STORE_ID
        api_key = settings.LEMONSQUEEZY_API_KEY
        sandbox = getattr(settings, 'LEMONSQUEEZY_SANDBOX', True)

        # Tag sandbox transactions in metadata
        if sandbox:
            txn.metadata = txn.metadata or {}
            txn.metadata['sandbox'] = True
            txn.save()

        # If API key is not configured, return a demo response
        if not api_key or not store_id:
            txn.payment_intent_id = f'ls_demo_{txn.id}'
            txn.save()
            return Response({
                'checkout_url': None,
                'checkout_id': None,
                'transaction_id': txn.id,
                'amount': float(amount),
                'currency': currency,
                'demo': True,
                'sandbox': sandbox,
                'message': 'Lemon Squeezy not configured. Set LEMONSQUEEZY_API_KEY and LEMONSQUEEZY_STORE_ID.',
            }, status=status.HTTP_201_CREATED)

        # Create a real Lemon Squeezy checkout
        from .lemonsqueezy import LemonSqueezyError, create_checkout

        success_url = f'{settings.FRONTEND_URL}/modules/{module_id}' if module_id else f'{settings.FRONTEND_URL}/subscription'

        try:
            checkout = create_checkout(
                store_id=store_id,
                variant_id=variant_id,
                user_email=user.email,
                user_name=user.get_full_name() or user.username,
                custom_data=custom_data,
                success_url=success_url,
            )
        except LemonSqueezyError as e:
            txn.status = PaymentTransaction.PaymentStatus.FAILED
            txn.save()
            logger.error('Lemon Squeezy checkout failed for user %s: %s', user.id, e)
            return Response(
                {'detail': 'Failed to create checkout. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        txn.payment_intent_id = checkout['checkout_id']
        txn.save()

        return Response({
            'checkout_url': checkout['checkout_url'],
            'checkout_id': checkout['checkout_id'],
            'transaction_id': txn.id,
            'amount': float(amount),
            'currency': currency,
            'sandbox': sandbox,
        }, status=status.HTTP_201_CREATED)


class LemonSqueezyWebhookView(APIView):
    """
    Handle Lemon Squeezy webhook callbacks.

    Events handled:
    - order_created: Completes course purchase transactions.
    - subscription_created: Activates subscription.
    - subscription_updated: Updates subscription status.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @db_transaction.atomic
    def post(self, request, *args, **kwargs):
        from .lemonsqueezy import is_sandbox, verify_webhook_signature

        sandbox = is_sandbox()

        # Verify signature — skip in sandbox if no secret is configured
        signature = request.META.get('HTTP_X_SIGNATURE', '')
        if settings.LEMONSQUEEZY_WEBHOOK_SECRET:
            if not verify_webhook_signature(request.body, signature):
                logger.warning('Invalid Lemon Squeezy webhook signature')
                return Response(status=status.HTTP_403_FORBIDDEN)
        elif not sandbox:
            logger.error('LEMONSQUEEZY_WEBHOOK_SECRET not set in production mode — rejecting webhook')
            return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        event_name = payload.get('meta', {}).get('event_name', '')
        custom_data = payload.get('meta', {}).get('custom_data', {})
        attributes = payload.get('data', {}).get('attributes', {})

        transaction_id = custom_data.get('transaction_id')
        if not transaction_id:
            logger.warning('Lemon Squeezy webhook missing transaction_id in custom_data')
            return Response(status=status.HTTP_200_OK)

        try:
            txn = PaymentTransaction.objects.select_for_update().get(id=transaction_id)
        except PaymentTransaction.DoesNotExist:
            logger.warning('Lemon Squeezy webhook: transaction %s not found', transaction_id)
            return Response(status=status.HTTP_200_OK)

        if event_name == 'order_created':
            self._handle_order_created(txn, attributes, custom_data)
        elif event_name == 'subscription_created':
            self._handle_subscription_created(txn, attributes, custom_data)
        elif event_name == 'subscription_updated':
            self._handle_subscription_updated(txn, attributes, custom_data)
        else:
            logger.info('Unhandled Lemon Squeezy event: %s', event_name)

        return Response(status=status.HTTP_200_OK)

    def _handle_order_created(self, txn, attributes, custom_data):
        """Complete a course purchase when order is created."""
        if txn.status != PaymentTransaction.PaymentStatus.PENDING:
            return

        order_status = attributes.get('status', '')
        if order_status not in ('paid', 'refunded'):
            return

        txn.status = PaymentTransaction.PaymentStatus.COMPLETED
        txn.completed_at = timezone.now()
        txn.transaction_id = str(attributes.get('order_number', ''))
        txn.metadata = {
            'ls_order_id': attributes.get('identifier', ''),
            'ls_status': order_status,
        }
        txn.save()

        # Enroll user in the course
        if txn.module:
            enrollment, created = CourseEnrollment.objects.get_or_create(
                user=txn.user,
                module=txn.module,
                defaults={'is_active': True},
            )
            if not created:
                enrollment.is_active = True
                enrollment.save()
            logger.info('User %s enrolled in module %s via Lemon Squeezy', txn.user.id, txn.module.id)

    def _handle_subscription_created(self, txn, attributes, custom_data):
        """Activate subscription when subscription is created."""
        if txn.status != PaymentTransaction.PaymentStatus.PENDING:
            return

        txn.status = PaymentTransaction.PaymentStatus.COMPLETED
        txn.completed_at = timezone.now()
        txn.transaction_id = str(attributes.get('order_id', ''))
        txn.metadata = {
            'ls_subscription_id': attributes.get('urls', {}).get('update_payment_method', ''),
            'ls_status': attributes.get('status', ''),
            'ls_variant_id': attributes.get('variant_id', ''),
        }
        txn.save()

        # Activate the subscription
        plan_id = custom_data.get('plan_id')
        if plan_id:
            self._activate_subscription(txn.user, plan_id)

    def _handle_subscription_updated(self, txn, attributes, custom_data):
        """Update subscription on status changes (pause, cancel, resume)."""
        ls_status = attributes.get('status', '')
        txn.metadata = txn.metadata or {}
        txn.metadata['ls_status'] = ls_status
        txn.save()

        if ls_status in ('cancelled', 'expired', 'paused'):
            from ai_tutor.models import Subscription
            try:
                sub = Subscription.objects.get(user=txn.user)
                sub.is_active = False
                sub.save()
                logger.info('Subscription deactivated for user %s (status: %s)', txn.user.id, ls_status)
            except Subscription.DoesNotExist:
                pass
        elif ls_status == 'active':
            plan_id = custom_data.get('plan_id') or (txn.metadata or {}).get('plan_id')
            if plan_id:
                self._activate_subscription(txn.user, plan_id)

    def _activate_subscription(self, user, plan_id):
        """Activate or update a user's subscription from a plan."""
        from datetime import timedelta

        from ai_tutor.models import Subscription, SubscriptionPlan

        try:
            plan = SubscriptionPlan.objects.get(pk=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            logger.error('Plan %s not found during subscription activation', plan_id)
            return

        sub, _ = Subscription.objects.get_or_create(
            user=user,
            defaults={
                'tier': plan.tier,
                'monthly_chat_limit': plan.monthly_chat_limit,
                'monthly_token_limit': plan.monthly_token_limit,
            },
        )
        sub.tier = plan.tier
        sub.is_active = True
        sub.monthly_chat_limit = plan.monthly_chat_limit
        sub.monthly_token_limit = plan.monthly_token_limit

        if plan.billing_period == 'MONTHLY':
            sub.expires_at = timezone.now() + timedelta(days=30)
        elif plan.billing_period == 'YEARLY':
            sub.expires_at = timezone.now() + timedelta(days=365)

        sub.save()
        logger.info('Subscription activated for user %s: tier=%s', user.id, plan.tier)
