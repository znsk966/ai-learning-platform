import hashlib
import hmac
import logging

import requests
from django.conf import settings

logger = logging.getLogger('payments')

LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1'


def is_sandbox():
    """Return True if Lemon Squeezy is running in sandbox/test mode."""
    return getattr(settings, 'LEMONSQUEEZY_SANDBOX', True)


def _get_headers():
    return {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': f'Bearer {settings.LEMONSQUEEZY_API_KEY}',
    }


def create_checkout(
    store_id,
    variant_id,
    *,
    user_email,
    user_name='',
    custom_data=None,
    success_url=None,
):
    """
    Create a Lemon Squeezy checkout session.

    Args:
        store_id: Lemon Squeezy store ID.
        variant_id: Product variant ID to purchase.
        user_email: Customer email to pre-fill.
        user_name: Customer name to pre-fill.
        custom_data: Dict of custom metadata (e.g. user_id, module_id).
        success_url: URL to redirect to after successful payment.

    Returns:
        dict with 'checkout_url' and 'checkout_id'.

    Raises:
        LemonSqueezyError on API failure.
    """
    sandbox = is_sandbox()
    if sandbox:
        logger.info('Lemon Squeezy checkout: running in SANDBOX mode')

    payload = {
        'data': {
            'type': 'checkouts',
            'attributes': {
                'checkout_data': {
                    'email': user_email,
                    'name': user_name,
                    'custom': custom_data or {},
                },
                'test_mode': sandbox,
            },
            'relationships': {
                'store': {
                    'data': {
                        'type': 'stores',
                        'id': str(store_id),
                    }
                },
                'variant': {
                    'data': {
                        'type': 'variants',
                        'id': str(variant_id),
                    }
                },
            },
        }
    }

    if success_url:
        payload['data']['attributes']['product_options'] = {
            'redirect_url': success_url,
        }

    response = requests.post(
        f'{LEMONSQUEEZY_API_BASE}/checkouts',
        json=payload,
        headers=_get_headers(),
        timeout=30,
    )

    if not response.ok:
        logger.error(
            'Lemon Squeezy checkout creation failed: %s %s',
            response.status_code,
            response.text,
        )
        raise LemonSqueezyError(
            f'Failed to create checkout: {response.status_code}'
        )

    data = response.json()['data']
    return {
        'checkout_id': data['id'],
        'checkout_url': data['attributes']['url'],
    }


def get_order(order_id):
    """
    Retrieve an order from Lemon Squeezy.

    Returns:
        dict with order attributes.
    """
    response = requests.get(
        f'{LEMONSQUEEZY_API_BASE}/orders/{order_id}',
        headers=_get_headers(),
        timeout=30,
    )

    if not response.ok:
        logger.error(
            'Lemon Squeezy order fetch failed: %s %s',
            response.status_code,
            response.text,
        )
        raise LemonSqueezyError(
            f'Failed to fetch order: {response.status_code}'
        )

    return response.json()['data']['attributes']


def get_subscription(subscription_id):
    """
    Retrieve a subscription from Lemon Squeezy.

    Returns:
        dict with subscription attributes.
    """
    response = requests.get(
        f'{LEMONSQUEEZY_API_BASE}/subscriptions/{subscription_id}',
        headers=_get_headers(),
        timeout=30,
    )

    if not response.ok:
        logger.error(
            'Lemon Squeezy subscription fetch failed: %s %s',
            response.status_code,
            response.text,
        )
        raise LemonSqueezyError(
            f'Failed to fetch subscription: {response.status_code}'
        )

    return response.json()['data']['attributes']


def verify_webhook_signature(payload_body, signature_header):
    """
    Verify the X-Signature header from a Lemon Squeezy webhook.

    Args:
        payload_body: Raw request body bytes.
        signature_header: Value of the X-Signature header.

    Returns:
        True if signature is valid, False otherwise.
    """
    secret = settings.LEMONSQUEEZY_WEBHOOK_SECRET
    if not secret:
        logger.warning('LEMONSQUEEZY_WEBHOOK_SECRET not configured')
        return False

    digest = hmac.new(
        secret.encode('utf-8'),
        payload_body,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(digest, signature_header)


class LemonSqueezyError(Exception):
    """Raised when a Lemon Squeezy API call fails."""
    pass
