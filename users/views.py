# ai-powered-learning/users/views.py

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.throttles import AuthRateThrottle

from .models import EmailVerificationToken, PasswordResetToken
from .serializers import (
    EmailVerificationSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    API view for user registration.
    Allows any user (even unauthenticated ones) to create a new user account.
    Creates an email verification token and sends verification email.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,) # This makes the view public
    authentication_classes = ()  # No authentication required for registration
    throttle_classes = [AuthRateThrottle]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        """Override to create email verification token and send email"""
        user = serializer.save()

        # Create email verification token
        verification_token = EmailVerificationToken.objects.create(user=user)

        # Send verification email
        self.send_verification_email(user, verification_token.token)

        return user

    def send_verification_email(self, user, token):
        """Send email verification link to user"""
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}/"

        subject = 'Verify Your Email Address'
        html_message = render_to_string('users/email_verification.html', {
            'user': user,
            'verification_url': verification_url,
        })
        plain_message = strip_tags(html_message)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

class EmailVerificationView(APIView):
    """
    Verify user email with token.
    """
    permission_classes = (AllowAny,)
    authentication_classes = ()  # No authentication required

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']

            try:
                verification = EmailVerificationToken.objects.get(token=token)

                if not verification.is_valid():
                    return Response(
                        {'error': 'Invalid or expired verification token.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Mark token as verified and activate user
                verification.is_verified = True
                verification.save()

                user = verification.user
                user.is_active = True
                user.save()

                return Response({
                    'message': 'Email verified successfully. You can now log in.',
                    'verified': True
                }, status=status.HTTP_200_OK)

            except EmailVerificationToken.DoesNotExist:
                return Response(
                    {'error': 'Invalid verification token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(APIView):
    """
    Resend verification email to user.
    """
    permission_classes = (AllowAny,)
    authentication_classes = ()  # No authentication required

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            if user.is_active:
                return Response(
                    {'message': 'Email is already verified.'},
                    status=status.HTTP_200_OK
            )

            # Get or create verification token
            verification_token, created = EmailVerificationToken.objects.get_or_create(
                user=user,
                defaults={'is_verified': False}
            )

            # If token exists but is verified, create a new one
            if verification_token.is_verified:
                verification_token.delete()
                verification_token = EmailVerificationToken.objects.create(user=user)
            elif not verification_token.is_valid():
                # Token expired, create new one
                verification_token.delete()
                verification_token = EmailVerificationToken.objects.create(user=user)

            # Send verification email
            verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token.token}/"
            subject = 'Verify Your Email Address'
            html_message = render_to_string('users/email_verification.html', {
                'user': user,
                'verification_url': verification_url,
            })
            plain_message = strip_tags(html_message)

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

            return Response({
                'message': 'Verification email sent successfully.'
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response({
                'message': 'If an account exists with this email, a verification email has been sent.'
            }, status=status.HTTP_200_OK)

class PasswordResetRequestView(APIView):
    """
    Request password reset - sends email with reset token.
    """
    permission_classes = (AllowAny,)
    authentication_classes = ()  # No authentication required
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']

            try:
                user = User.objects.get(email=email)

                # Create password reset token
                reset_token = PasswordResetToken.objects.create(user=user)

                # Send password reset email
                reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token.token}/"
                subject = 'Password Reset Request'
                html_message = render_to_string('users/password_reset_email.html', {
                    'user': user,
                    'reset_url': reset_url,
                    'token': reset_token.token,
                })
                plain_message = strip_tags(html_message)

                send_mail(
                    subject=subject,
                    message=plain_message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                    recipient_list=[user.email],
                    html_message=html_message,
                    fail_silently=False,
                )

                return Response({
                    'message': 'If an account exists with this email, a password reset link has been sent.'
                }, status=status.HTTP_200_OK)

            except User.DoesNotExist:
                # Don't reveal if email exists or not (security best practice)
                return Response({
                    'message': 'If an account exists with this email, a password reset link has been sent.'
                }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token and new password.
    """
    permission_classes = (AllowAny,)
    authentication_classes = ()  # No authentication required

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']

            try:
                reset_token = PasswordResetToken.objects.get(token=token)

                if not reset_token.is_valid():
                    return Response(
                        {'error': 'Invalid or expired reset token.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Update user password
                user = reset_token.user
                user.set_password(new_password)
                user.save()

                # Mark token as used
                reset_token.is_used = True
                reset_token.save()

                # Invalidate all other reset tokens for this user
                PasswordResetToken.objects.filter(
                    user=user,
                    is_used=False
                ).update(is_used=True)

                return Response({
                    'message': 'Password reset successfully. You can now log in with your new password.'
                }, status=status.HTTP_200_OK)

            except PasswordResetToken.DoesNotExist:
                return Response(
                    {'error': 'Invalid reset token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordChangeView(APIView):
    """
    Change password for authenticated users.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data['new_password']

            # Update password
            user.set_password(new_password)
            user.save()

            return Response({
                'message': 'Password changed successfully.'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """
    Get or update the authenticated user's profile.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
