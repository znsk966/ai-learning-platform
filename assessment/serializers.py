from rest_framework import serializers

from .models import AnswerChoice, Question, Quiz, QuizAttempt


class AnswerChoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for answer choices.
    For security, we will NOT expose the 'is_correct' field when a user is taking a quiz.
    """
    class Meta:
        model = AnswerChoice
        # Exclude 'is_correct' to prevent users from seeing the right answer in the API response.
        fields = ['id', 'answer_text']

class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer for questions, including its nested answer choices.
    """
    choices = AnswerChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'choices']

class QuizSerializer(serializers.ModelSerializer):
    """
    Serializer for a quiz, which includes all of its questions.
    """
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'passing_score', 'questions']


# --- Serializers for Submitting and Reviewing Attempts ---

class QuizAttemptAnswerSerializer(serializers.Serializer):
    """
    A simple serializer to validate the structure of an answer provided by the user.
    """
    question_id = serializers.IntegerField()
    answer_choice_id = serializers.IntegerField()


class QuizSubmissionSerializer(serializers.Serializer):
    """
    The main serializer for validating a user's quiz submission.
    It expects a list of answers in a specific format.
    """
    answers = QuizAttemptAnswerSerializer(many=True)


class AnswerChoiceResultSerializer(serializers.ModelSerializer):
    """
    A serializer for answer choices used when REVIEWING a quiz.
    This one safely EXPOSES the 'is_correct' field.
    """
    class Meta:
        model = AnswerChoice
        # 'is_correct' is included here for the results page.
        fields = ['id', 'answer_text', 'is_correct']


class QuestionResultSerializer(serializers.ModelSerializer):
    """
    Serializer for questions when reviewing results. Includes all answer choices.
    """
    choices = AnswerChoiceResultSerializer(many=True, read_only=True)
    # We will manually add the user's selected answer in the view.
    user_answer = serializers.IntegerField(required=False)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'choices', 'user_answer']


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    """
    The detailed serializer for showing the results of a specific quiz attempt.
    """
    # This will be a custom representation of the questions with user answers included.
    questions = QuestionResultSerializer(many=True, read_only=True, source='quiz.questions')

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'score', 'passed', 'timestamp', 'questions']
