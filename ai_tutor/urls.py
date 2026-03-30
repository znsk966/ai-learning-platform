from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .subscription_views import AIChatUsageViewSet, CreateSubscriptionView, SubscriptionPlanViewSet, SubscriptionViewSet
from .views import AIAskView

router = DefaultRouter()
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'usage', AIChatUsageViewSet, basename='ai-usage')

urlpatterns = [
    path('ask/', AIAskView.as_view(), name='ai-ask'),
    path('', include(router.urls)),
    path('subscribe/', CreateSubscriptionView.as_view(), name='create-subscription'),
]
