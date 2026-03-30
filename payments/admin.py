from django.contrib import admin

from .models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'module', 'amount', 'currency', 'payment_method', 'status', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('user__username', 'user__email', 'module__title', 'transaction_id', 'payment_intent_id')
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    date_hierarchy = 'created_at'

    fieldsets = (
        ('User & Course', {
            'fields': ('user', 'module')
        }),
        ('Payment Details', {
            'fields': ('amount', 'currency', 'payment_method', 'status')
        }),
        ('Payment Gateway', {
            'fields': ('payment_intent_id', 'transaction_id', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )
