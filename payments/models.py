from django.db import models
from django.conf import settings
from content.models import Module


class PaymentTransaction(models.Model):
    """Tracks payment transactions for course purchases"""
    
    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    class PaymentMethod(models.TextChoices):
        STRIPE = 'STRIPE', 'Stripe'
        PAYPAL = 'PAYPAL', 'PayPal'
        LEMON_SQUEEZY = 'LEMONSQ', 'Lemon Squeezy'
        FREE = 'FREE', 'Free Enrollment'
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    module = models.ForeignKey(
        Module, 
        on_delete=models.CASCADE, 
        related_name='payments',
        null=True,
        blank=True,
        help_text="Null for subscription payments"
    )
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices, default=PaymentMethod.STRIPE)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    
    # External payment gateway references
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True, help_text="Stripe PaymentIntent ID or PayPal transaction ID")
    transaction_id = models.CharField(max_length=255, blank=True, null=True, unique=True, help_text="Unique transaction ID from payment gateway")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    # Additional metadata (for storing payment gateway responses, etc.)
    metadata = models.JSONField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['transaction_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.module.title} - {self.amount} {self.currency} ({self.status})"
