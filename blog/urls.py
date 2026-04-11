from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, PostViewSet, TagViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='blog-post')
router.register(r'categories', CategoryViewSet, basename='blog-category')
router.register(r'tags', TagViewSet, basename='blog-tag')

urlpatterns = [
    path('', include(router.urls)),
]
