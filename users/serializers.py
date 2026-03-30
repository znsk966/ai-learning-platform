# ai-powered-learning/users/serializers.py

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers, validators


class RegisterSerializer(serializers.ModelSerializer):
    # We are using the default Django User model which requires a username.
    # We add an email field and make it required. We also add a validator
    # to ensure that the email is unique.
    email = serializers.EmailField(
        required=True,
        validators=[validators.UniqueValidator(queryset=User.objects.all())]
    )

    # The password field is set to write_only, which means it will be used for
    # validation and saving the instance, but will not be included when the
    # object is serialized and returned in a response.
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        # List all the fields that should be validated and used for creating the user
        fields = ('username', 'password', 'password_confirm', 'email')

    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Passwords do not match.',
                'password_confirm': 'Passwords do not match.'
            })
        return attrs

    def create(self, validated_data):
        """
        This method is called when .save() is called on the serializer.
        It overrides the default create method to handle password hashing.
        """
        validated_data.pop('password_confirm')  # Remove password_confirm from validated_data
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            is_active=False  # User is inactive until email is verified
        )

        # Use set_password to ensure the password is properly hashed.
        # Never store plain text passwords!
        user.set_password(validated_data['password'])
        user.save()

        return user

class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification"""
    token = serializers.CharField(max_length=64, required=True)

class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    token = serializers.CharField(max_length=64, required=True)
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password': 'Passwords do not match.',
                'new_password_confirm': 'Passwords do not match.'
            })
        return attrs

class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change (authenticated users)"""
    old_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password': 'Passwords do not match.',
                'new_password_confirm': 'Passwords do not match.'
            })
        return attrs

    def validate_old_password(self, value):
        """Validate that old password is correct"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile (read + update)"""
    is_premium = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(format="%Y-%m-%d", read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'is_premium')
        read_only_fields = ('id', 'username', 'date_joined', 'is_premium')

    def get_is_premium(self, obj):
        try:
            return obj.profile.is_premium
        except Exception:
            return False
