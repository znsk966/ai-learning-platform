from django.contrib import admin

from .models import AIChatUsage, Subscription, SubscriptionPlan


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'tier', 'is_active', 'started_at', 'expires_at', 'auto_renew')
    list_filter = ('tier', 'is_active', 'auto_renew', 'started_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('started_at',)
    date_hierarchy = 'started_at'

    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Subscription Details', {
            'fields': ('tier', 'is_active', 'auto_renew', 'started_at', 'expires_at')
        }),
        ('Limits', {
            'fields': ('monthly_chat_limit', 'monthly_token_limit'),
            'description': 'Leave as 0 to use tier defaults'
        }),
    )


@admin.register(AIChatUsage)
class AIChatUsageAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'tokens_used', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'user__email', 'question')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Usage Info', {
            'fields': ('user', 'lesson', 'tokens_used', 'created_at')
        }),
        ('Content', {
            'fields': ('question', 'response'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'price', 'currency', 'billing_period', 'is_active')
    list_filter = ('tier', 'billing_period', 'is_active')
    search_fields = ('name',)

    fieldsets = (
        ('Plan Details', {
            'fields': ('name', 'tier', 'price', 'currency', 'billing_period', 'is_active', 'lemon_squeezy_variant_id')
        }),
        ('Limits', {
            'fields': ('monthly_chat_limit', 'monthly_token_limit'),
            'description': '0 = unlimited'
        }),
        ('Features', {
            'fields': ('features',)
        }),
    )
