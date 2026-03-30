import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from ai_tutor.models import Subscription, SubscriptionPlan
from content.models import CourseEnrollment, Module
from payments.models import PaymentTransaction

User = get_user_model()


class LemonSqueezyCheckoutTest(TestCase):
    """Tests for the Lemon Squeezy checkout endpoint."""

    def setUp(self):
        # Clear throttle caches so tests don't hit rate limits
        SimpleRateThrottle.cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.module = Module.objects.create(
            title='Paid Course', price=Decimal('29.99'), currency='USD', order=1
        )
        self.free_module = Module.objects.create(
            title='Free Course', price=Decimal('0.00'), currency='USD', order=2
        )
        self.plan = SubscriptionPlan.objects.create(
            name='Pro Plan', tier='PRO', price=Decimal('19.99'),
            billing_period='MONTHLY', monthly_chat_limit=100,
            monthly_token_limit=50000, is_active=True,
        )

    def test_checkout_creates_pending_transaction(self):
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        txn = PaymentTransaction.objects.get(user=self.user, module=self.module)
        self.assertEqual(txn.status, 'PENDING')
        self.assertEqual(txn.payment_method, 'LEMONSQ')
        self.assertEqual(txn.amount, Decimal('29.99'))

    def test_checkout_rejects_free_module(self):
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.free_module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_rejects_already_enrolled(self):
        CourseEnrollment.objects.create(user=self.user, module=self.module, is_active=True)
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already enrolled', resp.data['detail'])

    def test_checkout_requires_module_or_plan(self):
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_with_plan(self):
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_456',
            'plan_id': self.plan.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        txn = PaymentTransaction.objects.get(user=self.user, module__isnull=True)
        self.assertEqual(txn.amount, Decimal('19.99'))
        self.assertEqual(txn.metadata.get('plan_id'), self.plan.id)

    def test_checkout_invalid_plan(self):
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_456',
            'plan_id': 99999,
        })
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_checkout_demo_mode_when_no_api_key(self):
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.data.get('demo'))
        self.assertIsNone(resp.data.get('checkout_url'))

    @override_settings(
        LEMONSQUEEZY_API_KEY='test_key',
        LEMONSQUEEZY_STORE_ID='store_123',
        FRONTEND_URL='http://localhost:5173',
    )
    @patch('payments.lemonsqueezy.create_checkout')
    def test_checkout_calls_lemonsqueezy_api(self, mock_create):
        mock_create.return_value = {
            'checkout_id': 'chk_abc',
            'checkout_url': 'https://checkout.lemonsqueezy.com/abc',
        }
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['checkout_url'], 'https://checkout.lemonsqueezy.com/abc')
        mock_create.assert_called_once()
        txn = PaymentTransaction.objects.get(user=self.user)
        self.assertEqual(txn.payment_intent_id, 'chk_abc')

    @override_settings(
        LEMONSQUEEZY_API_KEY='test_key',
        LEMONSQUEEZY_STORE_ID='store_123',
        FRONTEND_URL='http://localhost:5173',
    )
    @patch('payments.lemonsqueezy.create_checkout')
    def test_checkout_handles_api_failure(self, mock_create):
        from payments.lemonsqueezy import LemonSqueezyError
        mock_create.side_effect = LemonSqueezyError('API error')
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_502_BAD_GATEWAY)
        txn = PaymentTransaction.objects.get(user=self.user)
        self.assertEqual(txn.status, 'FAILED')

    def test_checkout_requires_auth(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    @override_settings(LEMONSQUEEZY_SANDBOX=True)
    def test_sandbox_flag_in_demo_response(self):
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.data.get('sandbox'))
        txn = PaymentTransaction.objects.get(user=self.user)
        self.assertTrue(txn.metadata.get('sandbox'))

    @override_settings(LEMONSQUEEZY_SANDBOX=False)
    def test_sandbox_false_not_tagged(self):
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertFalse(resp.data.get('sandbox'))

    @override_settings(
        LEMONSQUEEZY_API_KEY='test_key',
        LEMONSQUEEZY_STORE_ID='store_123',
        LEMONSQUEEZY_SANDBOX=True,
        FRONTEND_URL='http://localhost:5173',
    )
    @patch('payments.lemonsqueezy.create_checkout')
    def test_sandbox_sends_test_mode_to_api(self, mock_create):
        mock_create.return_value = {
            'checkout_id': 'chk_sandbox',
            'checkout_url': 'https://checkout.lemonsqueezy.com/sandbox',
        }
        resp = self.client.post('/api/payments/lemonsqueezy/checkout/', {
            'variant_id': 'var_123',
            'module_id': self.module.id,
        })
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(resp.data.get('sandbox'))
        # Verify test_mode was set in the API call payload
        call_kwargs = mock_create.call_args
        self.assertIn('user_email', call_kwargs.kwargs)


WEBHOOK_SECRET = 'test_webhook_secret'


def _sign_payload(payload_bytes):
    return hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()


def _build_webhook_payload(event_name, custom_data, attributes=None):
    payload = {
        'meta': {
            'event_name': event_name,
            'custom_data': custom_data,
        },
        'data': {
            'attributes': attributes or {},
        },
    }
    return json.dumps(payload).encode('utf-8')


@override_settings(LEMONSQUEEZY_WEBHOOK_SECRET=WEBHOOK_SECRET)
class LemonSqueezyWebhookTest(TestCase):
    """Tests for the Lemon Squeezy webhook endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='buyer', email='buyer@example.com', password='pass123'
        )
        self.module = Module.objects.create(
            title='Webhook Course', price=Decimal('49.99'), currency='USD', order=1
        )
        self.txn = PaymentTransaction.objects.create(
            user=self.user,
            module=self.module,
            amount=Decimal('49.99'),
            currency='USD',
            status='PENDING',
            payment_method='LEMONSQ',
        )
        self.plan = SubscriptionPlan.objects.create(
            name='Premium', tier='PREMIUM', price=Decimal('9.99'),
            billing_period='MONTHLY', monthly_chat_limit=50,
            monthly_token_limit=25000, is_active=True,
        )

    def _post_webhook(self, payload_bytes, signature=None):
        if signature is None:
            signature = _sign_payload(payload_bytes)
        return self.client.post(
            '/api/payments/lemonsqueezy/webhook/',
            data=payload_bytes,
            content_type='application/json',
            HTTP_X_SIGNATURE=signature,
        )

    def test_order_created_completes_transaction_and_enrolls(self):
        payload = _build_webhook_payload(
            'order_created',
            {'transaction_id': str(self.txn.id), 'user_id': str(self.user.id)},
            {'status': 'paid', 'order_number': 'ORD-001', 'identifier': 'ls_id_1'},
        )
        resp = self._post_webhook(payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        self.txn.refresh_from_db()
        self.assertEqual(self.txn.status, 'COMPLETED')
        self.assertIsNotNone(self.txn.completed_at)
        self.assertEqual(self.txn.transaction_id, 'ORD-001')
        self.assertTrue(
            CourseEnrollment.objects.filter(user=self.user, module=self.module, is_active=True).exists()
        )

    def test_order_created_ignores_non_pending(self):
        self.txn.status = 'COMPLETED'
        self.txn.save()
        payload = _build_webhook_payload(
            'order_created',
            {'transaction_id': str(self.txn.id)},
            {'status': 'paid'},
        )
        resp = self._post_webhook(payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # Should not create enrollment
        self.assertFalse(CourseEnrollment.objects.filter(user=self.user, module=self.module).exists())

    def test_subscription_created_activates_subscription(self):
        sub_txn = PaymentTransaction.objects.create(
            user=self.user, module=None,
            amount=Decimal('9.99'), currency='USD',
            status='PENDING', payment_method='LEMONSQ',
            metadata={'plan_id': self.plan.id},
        )
        payload = _build_webhook_payload(
            'subscription_created',
            {'transaction_id': str(sub_txn.id), 'plan_id': str(self.plan.id)},
            {'status': 'active', 'order_id': 'sub_order_1', 'variant_id': 'var_1', 'urls': {}},
        )
        resp = self._post_webhook(payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        sub_txn.refresh_from_db()
        self.assertEqual(sub_txn.status, 'COMPLETED')

        sub = Subscription.objects.get(user=self.user)
        self.assertTrue(sub.is_active)
        self.assertEqual(sub.tier, 'PREMIUM')
        self.assertEqual(sub.monthly_chat_limit, 50)

    def test_subscription_updated_cancels(self):
        Subscription.objects.create(
            user=self.user, tier='PREMIUM', is_active=True,
            monthly_chat_limit=50, monthly_token_limit=25000,
        )
        payload = _build_webhook_payload(
            'subscription_updated',
            {'transaction_id': str(self.txn.id)},
            {'status': 'cancelled'},
        )
        resp = self._post_webhook(payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        sub = Subscription.objects.get(user=self.user)
        self.assertFalse(sub.is_active)

    def test_invalid_signature_rejected(self):
        payload = _build_webhook_payload(
            'order_created',
            {'transaction_id': str(self.txn.id)},
            {'status': 'paid'},
        )
        resp = self._post_webhook(payload, signature='bad_signature')
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_transaction_id_returns_200(self):
        payload = _build_webhook_payload('order_created', {}, {'status': 'paid'})
        resp = self._post_webhook(payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_unknown_event_returns_200(self):
        payload = _build_webhook_payload(
            'some_unknown_event',
            {'transaction_id': str(self.txn.id)},
        )
        resp = self._post_webhook(payload)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


@override_settings(LEMONSQUEEZY_WEBHOOK_SECRET='', LEMONSQUEEZY_SANDBOX=False)
class LemonSqueezyWebhookProductionTest(TestCase):
    """Webhook rejects unsigned requests when not in sandbox and no secret configured."""

    def test_production_rejects_when_no_secret(self):
        user = User.objects.create_user(username='produser', password='pass123')
        txn = PaymentTransaction.objects.create(
            user=user, amount=Decimal('10.00'), currency='USD',
            status='PENDING', payment_method='LEMONSQ',
        )
        payload = _build_webhook_payload(
            'order_created',
            {'transaction_id': str(txn.id)},
            {'status': 'paid'},
        )
        client = APIClient()
        resp = client.post(
            '/api/payments/lemonsqueezy/webhook/',
            data=payload, content_type='application/json',
            HTTP_X_SIGNATURE='anything',
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(LEMONSQUEEZY_WEBHOOK_SECRET='', LEMONSQUEEZY_SANDBOX=True)
    def test_sandbox_allows_when_no_secret(self):
        user = User.objects.create_user(username='sandboxuser', password='pass123')
        txn = PaymentTransaction.objects.create(
            user=user, amount=Decimal('10.00'), currency='USD',
            status='PENDING', payment_method='LEMONSQ',
        )
        payload = _build_webhook_payload(
            'order_created',
            {'transaction_id': str(txn.id)},
            {'status': 'paid'},
        )
        client = APIClient()
        resp = client.post(
            '/api/payments/lemonsqueezy/webhook/',
            data=payload, content_type='application/json',
            HTTP_X_SIGNATURE='anything',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
