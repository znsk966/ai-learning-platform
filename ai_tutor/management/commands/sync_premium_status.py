"""
Management command to sync Profile.is_premium with Subscription status.

Usage:
    python manage.py sync_premium_status
"""

from django.core.management.base import BaseCommand
from content.models import Profile
from ai_tutor.models import Subscription


class Command(BaseCommand):
    help = 'Syncs Profile.is_premium with Subscription status for all users'

    def handle(self, *args, **options):
        updated_count = 0
        unchanged_count = 0
        
        for profile in Profile.objects.all():
            try:
                subscription = profile.user.subscription
                # User is premium if they have an active, valid subscription that's not FREE
                should_be_premium = (
                    subscription.is_valid and 
                    subscription.tier != Subscription.SubscriptionTier.FREE
                )
                
                if profile.is_premium != should_be_premium:
                    profile.is_premium = should_be_premium
                    profile.save(update_fields=['is_premium'])
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Updated {profile.user.username}: is_premium = {should_be_premium}'
                        )
                    )
                else:
                    unchanged_count += 1
            except Subscription.DoesNotExist:
                # No subscription, should not be premium
                if profile.is_premium:
                    profile.is_premium = False
                    profile.save(update_fields=['is_premium'])
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'↻ Updated {profile.user.username}: No subscription, set is_premium = False'
                        )
                    )
                else:
                    unchanged_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Sync complete: {updated_count} updated, {unchanged_count} unchanged'
            )
        )
