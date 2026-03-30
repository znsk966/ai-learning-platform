from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ConfirmPaymentView,
    CreatePaymentIntentView,
    EnrollFreeCourseView,
    LemonSqueezyCheckoutView,
    LemonSqueezyWebhookView,
    PaymentTransactionViewSet,
)

router = DefaultRouter()
router.register(r'transactions', PaymentTransactionViewSet, basename='payment-transaction')

urlpatterns = [
    path('', include(router.urls)),
    path('create-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('confirm/', ConfirmPaymentView.as_view(), name='confirm-payment'),
    path('enroll-free/', EnrollFreeCourseView.as_view(), name='enroll-free-course'),
    path('lemonsqueezy/checkout/', LemonSqueezyCheckoutView.as_view(), name='lemonsqueezy-checkout'),
    path('lemonsqueezy/webhook/', LemonSqueezyWebhookView.as_view(), name='lemonsqueezy-webhook'),
]
