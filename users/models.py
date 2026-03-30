from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.crypto import get_random_string
from datetime import timedelta

class EmailVerificationToken(models.Model):
    """
    Token for email verification when a new user registers.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_verification_token'
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = get_random_string(length=64)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)  # Token expires in 7 days
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if token is still valid (not expired and not already used)"""
        return (
            not self.is_verified and
            timezone.now() < self.expires_at
        )
    
    def __str__(self):
        return f"Email verification for {self.user.email}"

class PasswordResetToken(models.Model):
    """
    Token for password reset requests.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = get_random_string(length=64)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)  # Token expires in 24 hours
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if token is still valid (not used and not expired)"""
        return (
            not self.is_used and
            timezone.now() < self.expires_at
        )
    
    def __str__(self):
        return f"Password reset for {self.user.email}"
    
    class Meta:
        ordering = ['-created_at']
