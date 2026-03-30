# ai-powered-learning/content/serializers.py

from rest_framework import serializers

from .models import Lesson, Module, Profile, SubModule


# --- LessonSerializer with 'status' field ---
class LessonSerializer(serializers.ModelSerializer):
    # This new field will be populated by the view logic. It is read-only.
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Lesson
        fields = [
            'id', 'submodule', 'title', 'lesson_type', 'order',
            'text_content', 'video_url', 'simulation_url',
            'ai_tutor_initial_prompt', 'ai_tutor_config',
            'status' # Add the new status field
        ]

# --- SubModuleSerializer and ModuleSerializer remain the same but will now benefit from the change above ---
class SubModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    class Meta:
        model = SubModule
        fields = [
            'id', 'module', 'title', 'description', 'order', 'lessons'
        ]

class ModuleSerializer(serializers.ModelSerializer):
    submodules = SubModuleSerializer(many=True, read_only=True)
    # Pricing and enrollment fields (computed in view)
    is_enrolled = serializers.BooleanField(read_only=True)
    can_access = serializers.BooleanField(read_only=True)
    is_free = serializers.BooleanField(read_only=True)

    class Meta:
        model = Module
        fields = [
            'id', 'title', 'description', 'order',
            'price', 'currency', 'is_premium_only',
            'is_free', 'is_enrolled', 'can_access',
            'submodules'
        ]

# --- Dashboard Serializers (No changes needed here) ---
class ContinueLearningLessonSerializer(serializers.ModelSerializer):
    moduleId = serializers.IntegerField(source='submodule.module.id', read_only=True)
    description = serializers.CharField(source='text_content', read_only=True)
    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'moduleId']

class DashboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    continue_learning = ContinueLearningLessonSerializer(source='last_viewed_lesson', read_only=True)
    class Meta:
        model = Profile
        fields = ['username', 'continue_learning']
