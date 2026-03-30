# ai-powered-learning/users/urls.py

from django.urls import path

from .views import (
    EmailVerificationView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ProfileView,
    RegisterView,
    ResendVerificationEmailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('verify-email/', EmailVerificationView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-change/', PasswordChangeView.as_view(), name='password_change'),
    path('profile/', ProfileView.as_view(), name='user_profile'),
]
