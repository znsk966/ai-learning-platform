"""
Signals to sync Profile.is_premium with Subscription status
"""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from content.models import Profile

from .models import Subscription


@receiver(post_save, sender=Subscription)
def sync_profile_premium_status(sender, instance, **kwargs):
    """
    Automatically update Profile.is_premium based on Subscription status.
    Premium = any active subscription that's not FREE tier.
    """
    try:
        profile = Profile.objects.get(user=instance.user)
        # User is premium if they have an active, valid subscription that's not FREE
        is_premium = (
            instance.is_valid and
            instance.tier != Subscription.SubscriptionTier.FREE
        )

        # Only update if changed to avoid unnecessary saves
        if profile.is_premium != is_premium:
            profile.is_premium = is_premium
            profile.save(update_fields=['is_premium'])
    except Profile.DoesNotExist:
        # Profile doesn't exist yet, create it
        Profile.objects.create(
            user=instance.user,
            is_premium=(
                instance.is_valid and
                instance.tier != Subscription.SubscriptionTier.FREE
            )
        )


@receiver(post_delete, sender=Subscription)
def update_profile_on_subscription_delete(sender, instance, **kwargs):
    """
    When a subscription is deleted, check if user has any other active subscriptions.
    If not, set is_premium to False.
    """
    try:
        profile = Profile.objects.get(user=instance.user)
        # Check if user has any other active, valid subscriptions
        has_other_premium = Subscription.objects.filter(
            user=instance.user,
            is_active=True
        ).exclude(
            tier=Subscription.SubscriptionTier.FREE
        ).exists()

        if not has_other_premium:
            profile.is_premium = False
            profile.save(update_fields=['is_premium'])
    except Profile.DoesNotExist:
        pass
