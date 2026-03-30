# ai-powered-learning/content/models.py

from django.db import models
from django.conf import settings

# ... (Module, SubModule, and Lesson models remain unchanged) ...
class Module(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0, db_index=True, help_text="Order in which the module appears")
    # Pricing fields
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Price of the course (0.00 for free courses)")
    currency = models.CharField(max_length=3, default='USD', help_text="Currency code (e.g., USD, EUR)")
    is_premium_only = models.BooleanField(default=False, help_text="If True, only premium users can access this course")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['order', 'title']
    def __str__(self):
        return self.title
    
    @property
    def is_free(self):
        """Check if the course is free"""
        return self.price == 0.00

class SubModule(models.Model):
    module = models.ForeignKey(Module, related_name='submodules', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0, db_index=True, help_text="Order within the parent module")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['module', 'order', 'title']
    def __str__(self):
        return f"{self.module.title} - {self.title}"

class Lesson(models.Model):
    class LessonType(models.TextChoices):
        READING = 'READ', 'Reading Material'
        VIDEO = 'VID', 'Video Content'
        SIMULATION = 'SIM', 'Interactive Simulation'
        QUIZ = 'QUIZ', 'Quiz / Assessment'
        PROBLEM_SOLVING = 'PROB', 'Problem Solving Exercise'
        AI_TUTOR = 'AI', 'AI Tutor Session'
    submodule = models.ForeignKey(SubModule, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    lesson_type = models.CharField(max_length=4, choices=LessonType.choices, default=LessonType.READING,)
    order = models.PositiveIntegerField(default=0, db_index=True, help_text="Order within the parent submodule")
    text_content = models.TextField(blank=True, null=True, help_text="Text content for reading, problem description, etc.")
    video_url = models.URLField(blank=True, null=True, help_text="URL for video content (e.g., YouTube, Vimeo)")
    simulation_url = models.URLField(blank=True, null=True, help_text="URL for an interactive simulation")
    ai_tutor_initial_prompt = models.TextField(blank=True, null=True, help_text="Initial prompt or context for the AI Tutor")
    ai_tutor_config = models.JSONField(blank=True, null=True, help_text="Specific configuration for this AI tutor session")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['submodule', 'order', 'title']
    def __str__(self):
        return f"{self.submodule.title} - {self.title} ({self.get_lesson_type_display()})"

class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        primary_key=True,
    )
    last_viewed_lesson = models.ForeignKey(
        Lesson,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='last_viewed_by'
    )
    # --- ADD THIS NEW FIELD ---
    is_premium = models.BooleanField(default=False, help_text="Designates if the user has a premium subscription")

    def __str__(self):
        return f"Profile for {self.user.username}"

class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('user', 'lesson')
        ordering = ['-completed_at']
        indexes = [
            models.Index(fields=['user', 'lesson']),
        ]
    def __str__(self):
        return f"{self.user.username} completed {self.lesson.title}"

class CourseEnrollment(models.Model):
    """Tracks user enrollment in courses (modules)"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, help_text="Set to False if enrollment is cancelled/refunded")
    
    class Meta:
        unique_together = ('user', 'module')
        ordering = ['-enrolled_at']
        indexes = [
            models.Index(fields=['user', 'module']),
        ]
    
    def __str__(self):
        return f"{self.user.username} enrolled in {self.module.title}"
