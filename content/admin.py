# ai-powered-learning/content/admin.py
from django import forms
from django.contrib import admin
from mdeditor.widgets import MDEditorWidget

from .models import CourseEnrollment, Lesson, Module, Profile, SubModule  # <-- Import Profile and CourseEnrollment


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'order', 'price', 'currency', 'is_premium_only', 'description')
    list_filter = ('is_premium_only', 'currency')
    search_fields = ('title', 'description')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'order')
        }),
        ('Pricing', {
            'fields': ('price', 'currency', 'is_premium_only')
        }),
    )

@admin.register(SubModule)
class SubModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'order', 'description')
    list_filter = ('module',)
    search_fields = ('title', 'description')

class LessonAdminForm(forms.ModelForm):
    text_content = forms.CharField(widget=MDEditorWidget, required=False)
    class Meta:
        model = Lesson
        fields = '__all__'

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    form = LessonAdminForm
    list_display = ('title', 'submodule', 'lesson_type', 'order')
    list_filter = ('submodule__module', 'submodule', 'lesson_type')
    search_fields = ('title', 'text_content')
    fieldsets = (
        (None, {
            'fields': ('submodule', 'title', 'lesson_type', 'order')
        }),
        ('Content Specifics (fill based on Lesson Type)', {
            'classes': ('collapse',),
            'fields': ('text_content', 'video_url', 'simulation_url', 'ai_tutor_initial_prompt', 'ai_tutor_config'),
        }),
    )

# --- ADD THIS NEW SECTION TO REGISTER THE PROFILE MODEL ---
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """
    Admin view for user profiles.
    Note: is_premium is automatically synced with Subscription model.
    You can manually override it here, but it will be updated when subscription changes.
    """
    list_display = ('user', 'is_premium', 'last_viewed_lesson', 'get_subscription_tier')
    list_editable = ('is_premium',) # Allows manual override, but will sync with subscription
    search_fields = ('user__username',)
    readonly_fields = ('get_subscription_tier', 'get_subscription_status')

    def get_subscription_tier(self, obj):
        """Display current subscription tier"""
        try:
            subscription = obj.user.subscription
            if subscription.is_valid:
                return f"{subscription.get_tier_display()} (Active)"
            else:
                return f"{subscription.get_tier_display()} (Expired)"
        except Exception:
            return "No Subscription"
    get_subscription_tier.short_description = 'Subscription'

    def get_subscription_status(self, obj):
        """Display subscription status details"""
        try:
            subscription = obj.user.subscription
            status_parts = []
            if subscription.is_valid:
                status_parts.append("✓ Active")
            else:
                status_parts.append("✗ Inactive")
            if subscription.expires_at:
                from django.utils import timezone
                if subscription.expires_at > timezone.now():
                    days_left = (subscription.expires_at - timezone.now()).days
                    status_parts.append(f"Expires in {days_left} days")
                else:
                    status_parts.append("Expired")
            return " | ".join(status_parts)
        except Exception:
            return "No subscription found"
    get_subscription_status.short_description = 'Subscription Status'

    fieldsets = (
        ('User Info', {
            'fields': ('user', 'last_viewed_lesson')
        }),
        ('Premium Status', {
            'fields': ('is_premium', 'get_subscription_tier', 'get_subscription_status'),
            'description': 'is_premium is automatically synced with Subscription. Manual changes may be overridden when subscription updates.'
        }),
    )

@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    """
    Admin view for course enrollments.
    """
    list_display = ('user', 'module', 'enrolled_at', 'is_active')
    list_filter = ('is_active', 'enrolled_at')
    search_fields = ('user__username', 'user__email', 'module__title')
    readonly_fields = ('enrolled_at',)
    date_hierarchy = 'enrolled_at'
