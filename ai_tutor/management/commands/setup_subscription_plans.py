"""
Management command to create default subscription plans.

Usage:
    python manage.py setup_subscription_plans
"""

from django.core.management.base import BaseCommand
from ai_tutor.models import SubscriptionPlan, Subscription


class Command(BaseCommand):
    help = 'Creates default subscription plans for the AI Tutor'

    def handle(self, *args, **options):
        plans_data = [
            {
                'name': 'Free',
                'tier': Subscription.SubscriptionTier.FREE,
                'price': 0.00,
                'currency': 'USD',
                'billing_period': 'MONTHLY',
                'monthly_chat_limit': 5,
                'monthly_token_limit': 10000,
                'features': {
                    'ai_tutor_access': 'Basic AI Tutor access',
                    'free_courses': 'Access to all free courses',
                    'community_support': 'Community support',
                    'basic_analytics': 'Basic progress tracking'
                },
                'is_active': True
            },
            {
                'name': 'Basic',
                'tier': Subscription.SubscriptionTier.BASIC,
                'price': 9.99,
                'currency': 'USD',
                'billing_period': 'MONTHLY',
                'monthly_chat_limit': 50,
                'monthly_token_limit': 100000,
                'features': {
                    'ai_tutor_access': '50 AI Tutor chats per month',
                    'priority_support': 'Priority email support',
                    'all_free_courses': 'Access to all free courses',
                    'progress_tracking': 'Advanced progress tracking',
                    'study_streaks': 'Study streak tracking'
                },
                'is_active': True
            },
            {
                'name': 'Basic (Yearly)',
                'tier': Subscription.SubscriptionTier.BASIC,
                'price': 99.00,
                'currency': 'USD',
                'billing_period': 'YEARLY',
                'monthly_chat_limit': 50,
                'monthly_token_limit': 100000,
                'features': {
                    'ai_tutor_access': '50 AI Tutor chats per month',
                    'priority_support': 'Priority email support',
                    'all_free_courses': 'Access to all free courses',
                    'progress_tracking': 'Advanced progress tracking',
                    'study_streaks': 'Study streak tracking',
                    'yearly_discount': 'Save 17% with yearly billing'
                },
                'is_active': True
            },
            {
                'name': 'Premium',
                'tier': Subscription.SubscriptionTier.PREMIUM,
                'price': 19.99,
                'currency': 'USD',
                'billing_period': 'MONTHLY',
                'monthly_chat_limit': 200,
                'monthly_token_limit': 500000,
                'features': {
                    'ai_tutor_access': '200 AI Tutor chats per month',
                    'premium_courses': 'Unlimited access to premium courses',
                    'advanced_analytics': 'Advanced progress analytics',
                    'priority_support': 'Priority email support',
                    'early_access': 'Early access to new features',
                    'export_reports': 'Export learning reports'
                },
                'is_active': True
            },
            {
                'name': 'Premium (Yearly)',
                'tier': Subscription.SubscriptionTier.PREMIUM,
                'price': 199.00,
                'currency': 'USD',
                'billing_period': 'YEARLY',
                'monthly_chat_limit': 200,
                'monthly_token_limit': 500000,
                'features': {
                    'ai_tutor_access': '200 AI Tutor chats per month',
                    'premium_courses': 'Unlimited access to premium courses',
                    'advanced_analytics': 'Advanced progress analytics',
                    'priority_support': 'Priority email support',
                    'early_access': 'Early access to new features',
                    'export_reports': 'Export learning reports',
                    'yearly_discount': 'Save 17% with yearly billing'
                },
                'is_active': True
            },
            {
                'name': 'Pro',
                'tier': Subscription.SubscriptionTier.PRO,
                'price': 39.99,
                'currency': 'USD',
                'billing_period': 'MONTHLY',
                'monthly_chat_limit': 0,  # Unlimited
                'monthly_token_limit': 0,  # Unlimited
                'features': {
                    'unlimited_chats': 'Unlimited AI Tutor chats',
                    'unlimited_tokens': 'Unlimited tokens',
                    'premium_courses': 'All premium course access',
                    'advanced_analytics': 'Advanced analytics dashboard',
                    'priority_support': 'Priority 24/7 support',
                    'custom_config': 'Custom AI tutor configurations',
                    'export_reports': 'Export learning reports',
                    'early_access': 'Early access to new features'
                },
                'is_active': True
            },
            {
                'name': 'Pro (Yearly)',
                'tier': Subscription.SubscriptionTier.PRO,
                'price': 399.00,
                'currency': 'USD',
                'billing_period': 'YEARLY',
                'monthly_chat_limit': 0,  # Unlimited
                'monthly_token_limit': 0,  # Unlimited
                'features': {
                    'unlimited_chats': 'Unlimited AI Tutor chats',
                    'unlimited_tokens': 'Unlimited tokens',
                    'premium_courses': 'All premium course access',
                    'advanced_analytics': 'Advanced analytics dashboard',
                    'priority_support': 'Priority 24/7 support',
                    'custom_config': 'Custom AI tutor configurations',
                    'export_reports': 'Export learning reports',
                    'early_access': 'Early access to new features',
                    'yearly_discount': 'Save 17% with yearly billing'
                },
                'is_active': True
            },
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans_data:
            plan, created = SubscriptionPlan.objects.update_or_create(
                name=plan_data['name'],
                billing_period=plan_data['billing_period'],
                defaults=plan_data
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created plan: {plan.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated plan: {plan.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Successfully processed {len(plans_data)} plans: '
                f'{created_count} created, {updated_count} updated'
            )
        )
