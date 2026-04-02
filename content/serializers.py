# ai-powered-learning/content/serializers.py

from rest_framework import serializers

from .models import Lesson, LessonFile, Module, Profile, SubModule


# --- LessonFileSerializer ---
class LessonFileSerializer(serializers.ModelSerializer):
    download_url = serializers.CharField(read_only=True)

    class Meta:
        model = LessonFile
        fields = ['id', 'file_name', 'file_type', 'file_size', 'description', 'download_url', 'order']


# --- LessonSerializer with 'status' field ---
class LessonSerializer(serializers.ModelSerializer):
    # This new field will be populated by the view logic. It is read-only.
    status = serializers.SerializerMethodField()
    bunny_embed_url = serializers.SerializerMethodField()
    files = LessonFileSerializer(many=True, read_only=True)

    def get_status(self, obj):
        lesson_status_map = self.context.get('lesson_status_map', {})
        return lesson_status_map.get(obj.id, getattr(obj, 'status', None))

    def get_bunny_embed_url(self, obj):
        if not obj.bunny_video_id:
            return None
        from django.conf import settings
        library_id = settings.BUNNY_STREAM_LIBRARY_ID
        if not library_id:
            return None
        return f"https://iframe.mediadelivery.net/embed/{library_id}/{obj.bunny_video_id}"

    class Meta:
        model = Lesson
        fields = [
            'id', 'submodule', 'title', 'lesson_type', 'order',
            'text_content', 'video_url', 'bunny_video_id', 'bunny_embed_url',
            'simulation_url',
            'ai_tutor_initial_prompt', 'ai_tutor_config',
            'status', 'files',
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
