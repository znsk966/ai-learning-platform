from django.contrib import admin

from .models import AnswerChoice, Question, Quiz, QuizAttempt


class AnswerChoiceInline(admin.TabularInline):
    """
    Allows editing AnswerChoice models on the Question admin page.
    """
    model = AnswerChoice
    extra = 1 # Show 1 extra empty answer choice form by default.
    fields = ['answer_text', 'is_correct']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    """
    Admin view for Question model.
    """
    list_display = ('question_text', 'quiz', 'question_type', 'order')
    list_filter = ('quiz__lesson__submodule__module', 'quiz') # Filter by module, then quiz
    inlines = [AnswerChoiceInline] # Embed the answer choice editor

class QuestionInline(admin.StackedInline):
    """
    Allows editing Question models on the Quiz admin page.
    """
    model = Question
    extra = 1 # Show 1 extra empty question form by default.
    fields = ('question_text', 'question_type', 'order')
    show_change_link = True # Allows you to click to the full question edit page

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    """
    Admin view for Quiz model.
    """
    list_display = ('title', 'lesson', 'passing_score')
    list_filter = ('lesson__submodule__module',) # Filter by module
    search_fields = ('title', 'lesson__title')
    inlines = [QuestionInline] # Embed the question editor

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    """
    Admin view to inspect and manage user quiz attempts.
    """
    list_display = ('user', 'quiz', 'score', 'passed', 'timestamp')
    list_filter = ('quiz', 'user', 'passed', 'timestamp')
    search_fields = ('user__username', 'quiz__title')
    readonly_fields = ('user', 'quiz', 'score', 'passed', 'timestamp')
    date_hierarchy = 'timestamp'

    # Prevent manual creation/editing, but allow deletion for admin cleanup
    def has_add_permission(self, request):
        return False  # Don't allow manual creation

    def has_change_permission(self, request, obj=None):
        return False  # Don't allow editing (read-only fields)

    # Allow deletion for staff users to clean up data
    def has_delete_permission(self, request, obj=None):
        return request.user.is_staff  # Allow deletion for staff users

