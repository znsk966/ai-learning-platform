from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from .models import EmailVerificationToken


class RegistrationTest(TestCase):
    """Tests for user registration."""

    def setUp(self):
        self.client = APIClient()

    def test_register_creates_inactive_user(self):
        """Registration should create an inactive user."""
        response = self.client.post('/api/users/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='newuser')
        self.assertFalse(user.is_active)

    def test_register_creates_verification_token(self):
        """Registration should create an email verification token."""
        self.client.post('/api/users/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }, format='json')
        user = User.objects.get(username='newuser')
        self.assertTrue(EmailVerificationToken.objects.filter(user=user).exists())

    def test_register_duplicate_email_rejected(self):
        """Cannot register with an email that already exists."""
        User.objects.create_user(username='existing', email='taken@example.com', password='pass123')
        response = self.client.post('/api/users/register/', {
            'username': 'newuser',
            'email': 'taken@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_mismatched_passwords_rejected(self):
        """Mismatched passwords should be rejected."""
        response = self.client.post('/api/users/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'DifferentPass456!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EmailVerificationTest(TestCase):
    """Tests for email verification."""

    def setUp(self):
        self.client = APIClient()
        # Register a user
        self.client.post('/api/users/register/', {
            'username': 'verifyuser',
            'email': 'verify@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }, format='json')
        self.user = User.objects.get(username='verifyuser')
        self.token = EmailVerificationToken.objects.get(user=self.user)

    def test_valid_token_activates_user(self):
        """A valid verification token should activate the user."""
        response = self.client.post('/api/users/verify-email/', {
            'token': str(self.token.token),
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)

    def test_invalid_token_rejected(self):
        """An invalid token should be rejected."""
        response = self.client.post('/api/users/verify-email/', {
            'token': 'invalid-token-12345',
        }, format='json')
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])


class JWTAuthTest(TestCase):
    """Tests for JWT token authentication."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='jwtuser', password='StrongPass123!', is_active=True
        )

    def test_login_returns_tokens(self):
        """Login should return access and refresh tokens."""
        response = self.client.post('/api/token/', {
            'username': 'jwtuser',
            'password': 'StrongPass123!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password_rejected(self):
        """Wrong password should be rejected."""
        response = self.client.post('/api/token/', {
            'username': 'jwtuser',
            'password': 'WrongPassword!',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_protected_endpoint_with_token(self):
        """Authenticated requests with valid JWT should succeed."""
        login_response = self.client.post('/api/token/', {
            'username': 'jwtuser',
            'password': 'StrongPass123!',
        }, format='json')
        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get('/api/content/modules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_access_protected_endpoint_without_token_denied(self):
        """Unauthenticated requests to protected endpoints should be denied."""
        response = self.client.get('/api/ai/subscriptions/current/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
