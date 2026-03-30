from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from content.models import UserLessonProgress  # To mark lessons as complete

from .models import AnswerChoice, Quiz, QuizAttempt
from .serializers import QuizAttemptResultSerializer, QuizSerializer, QuizSubmissionSerializer


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A read-only viewset for fetching quizzes.
    """
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter quizzes by lesson if lesson parameter is provided.
        """
        queryset = Quiz.objects.all()
        lesson_id = self.request.query_params.get('lesson', None)
        if lesson_id is not None:
            queryset = queryset.filter(lesson_id=lesson_id)
        return queryset

    @action(detail=True, methods=['post'], url_path='submit')
    @transaction.atomic # Ensures all database operations in this block succeed or fail together
    def submit(self, request, pk=None):
        """
        Handles the submission of a quiz. Calculates the score, saves the attempt,
        and marks the corresponding lesson as complete if the user passed.
        """
        quiz = self.get_object()
        user = request.user

        # Validate the submitted data format
        submission_serializer = QuizSubmissionSerializer(data=request.data)
        if not submission_serializer.is_valid():
            return Response(submission_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        submitted_answers = {item['question_id']: item['answer_choice_id'] for item in submission_serializer.validated_data['answers']}

        # Validate that all submitted answers belong to this quiz
        quiz_question_ids = set(quiz.questions.values_list('id', flat=True))
        valid_choice_ids = set(
            AnswerChoice.objects.filter(question__quiz=quiz).values_list('id', flat=True)
        )
        for question_id, choice_id in submitted_answers.items():
            if question_id not in quiz_question_ids:
                return Response(
                    {'detail': f'Question {question_id} does not belong to this quiz.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if choice_id not in valid_choice_ids:
                return Response(
                    {'detail': f'Answer choice {choice_id} does not belong to this quiz.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # --- Scoring Logic ---
        correct_answers = 0
        total_questions = quiz.questions.count()

        for question in quiz.questions.all():
            correct_choice_id = question.choices.filter(is_correct=True).first().id
            user_choice_id = submitted_answers.get(question.id)

            if user_choice_id == correct_choice_id:
                correct_answers += 1

        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = score >= quiz.passing_score

        # --- Create the QuizAttempt record ---
        attempt = QuizAttempt.objects.create(
            user=user,
            quiz=quiz,
            score=score,
            passed=passed
        )

        # --- Unlock Next Lesson if Passed ---
        if passed:
            UserLessonProgress.objects.get_or_create(user=user, lesson=quiz.lesson)

        # Return the detailed results of the attempt
        result_serializer = QuizAttemptResultSerializer(instance=attempt)
        response_data = result_serializer.data

        # Add user's answers to the questions
        for question_data in response_data['questions']:
            question_data['user_answer'] = submitted_answers.get(question_data['id'])

        return Response(response_data, status=status.HTTP_201_CREATED)

class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A read-only viewset for retrieving past quiz attempts.
    """
    serializer_class = QuizAttemptResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        This view should only return the attempts of the currently authenticated user.
        """
        return QuizAttempt.objects.filter(user=self.request.user).order_by('-timestamp')

