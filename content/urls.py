# ai-powered-learning/content/urls.py

from django.urls import include, path
from rest_framework.routers import DefaultRouter

# Import the new DashboardView
from .views import DashboardView, LessonViewSet, ModuleViewSet, NextLessonView, ProgressAnalyticsView, SubModuleViewSet

# Your existing router setup remains the same
router = DefaultRouter()
router.register(r'modules', ModuleViewSet, basename='module')
router.register(r'submodules', SubModuleViewSet, basename='submodule')
router.register(r'lessons', LessonViewSet, basename='lesson')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    # Add the specific path for our new dashboard view
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('next-lesson/', NextLessonView.as_view(), name='next-lesson'),
    path('progress-analytics/', ProgressAnalyticsView.as_view(), name='progress-analytics'),
    # Include all the URLs from the router for modules, submodules, and lessons
    path('', include(router.urls)),
]
