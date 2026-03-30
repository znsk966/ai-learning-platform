from rest_framework import serializers
from .models import PaymentTransaction
from content.models import Module


class PaymentTransactionSerializer(serializers.ModelSerializer):
    module_title = serializers.CharField(source='module.title', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'user', 'user_email', 'module', 'module_title',
            'amount', 'currency', 'payment_method', 'status',
            'payment_intent_id', 'transaction_id',
            'created_at', 'updated_at', 'completed_at', 'metadata'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'completed_at']


class CreatePaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating a payment intent"""
    module_id = serializers.IntegerField()
    
    def validate_module_id(self, value):
        try:
            module = Module.objects.get(pk=value)
            if module.is_free:
                raise serializers.ValidationError("This course is free. Use the free enrollment endpoint instead.")
            return value
        except Module.DoesNotExist:
            raise serializers.ValidationError("Module not found.")


class ConfirmPaymentSerializer(serializers.Serializer):
    """Serializer for confirming a payment"""
    payment_intent_id = serializers.CharField()
    transaction_id = serializers.CharField(required=False)


class LemonSqueezyCheckoutSerializer(serializers.Serializer):
    """Serializer for creating a Lemon Squeezy checkout"""
    module_id = serializers.IntegerField(required=False, help_text="Module ID for course purchase")
    plan_id = serializers.IntegerField(required=False, help_text="Subscription plan ID")
    variant_id = serializers.CharField(help_text="Lemon Squeezy product variant ID")

    def validate(self, data):
        if not data.get('module_id') and not data.get('plan_id'):
            raise serializers.ValidationError("Either module_id or plan_id is required.")
        if data.get('module_id') and data.get('plan_id'):
            raise serializers.ValidationError("Provide either module_id or plan_id, not both.")
        if data.get('module_id'):
            try:
                module = Module.objects.get(pk=data['module_id'])
                if module.is_free:
                    raise serializers.ValidationError("This course is free. Use the free enrollment endpoint.")
            except Module.DoesNotExist:
                raise serializers.ValidationError("Module not found.")
        return data
