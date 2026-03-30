from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from content.models import Lesson # We need to link a Quiz to a Lesson

class Quiz(models.Model):
    """
    A quiz that is associated with a single lesson.
    """
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=255)
    passing_score = models.PositiveIntegerField(
        default=80,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage required to pass (0-100)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Quiz for: {self.lesson.title}"

class Question(models.Model):
    """
    A single question within a quiz.
    """
    class QuestionType(models.TextChoices):
        MULTIPLE_CHOICE = 'MC', 'Multiple Choice'
        TRUE_FALSE = 'TF', 'True / False'
        # Future types can be added here
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=2, choices=QuestionType.choices, default=QuestionType.MULTIPLE_CHOICE)
    order = models.PositiveIntegerField(help_text="Order of the question in the quiz")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.question_text[:50] # Show first 50 chars

class AnswerChoice(models.Model):
    """
    A possible answer choice for a multiple-choice question.
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    answer_text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.answer_text} ({'Correct' if self.is_correct else 'Incorrect'})"

class QuizAttempt(models.Model):
    """
    Records a user's attempt at a quiz, their score, and whether they passed.
    This is the key to unlocking the next lesson.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.FloatField(help_text="The user's score as a percentage (e.g., 85.5)")
    passed = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s attempt at {self.quiz.title} - Score: {self.score}"
