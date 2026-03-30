from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from content.models import Lesson, Module, SubModule

from .models import AnswerChoice, Question, Quiz


class QuizSubmissionTest(TestCase):
    """Tests for quiz submission validation and scoring."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_active=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        module = Module.objects.create(title='Module', order=0, price=0.00)
        sub = SubModule.objects.create(module=module, title='Sub', order=0)
        lesson = Lesson.objects.create(submodule=sub, title='Quiz Lesson', order=0, lesson_type='QUIZ')

        self.quiz = Quiz.objects.create(lesson=lesson, title='Test Quiz', passing_score=80)

        # Create 2 questions with choices
        self.q1 = Question.objects.create(quiz=self.quiz, question_text='Q1?', order=0)
        self.q1_correct = AnswerChoice.objects.create(question=self.q1, answer_text='Correct', is_correct=True)
        self.q1_wrong = AnswerChoice.objects.create(question=self.q1, answer_text='Wrong', is_correct=False)

        self.q2 = Question.objects.create(quiz=self.quiz, question_text='Q2?', order=1)
        self.q2_correct = AnswerChoice.objects.create(question=self.q2, answer_text='Correct', is_correct=True)
        self.q2_wrong = AnswerChoice.objects.create(question=self.q2, answer_text='Wrong', is_correct=False)

        # Create another quiz to test injection
        lesson2 = Lesson.objects.create(submodule=sub, title='Other Lesson', order=1, lesson_type='QUIZ')
        self.other_quiz = Quiz.objects.create(lesson=lesson2, title='Other Quiz', passing_score=50)
        other_q = Question.objects.create(quiz=self.other_quiz, question_text='Other?', order=0)
        self.other_choice = AnswerChoice.objects.create(question=other_q, answer_text='Foreign', is_correct=True)

    def test_correct_answers_pass(self):
        """Submitting all correct answers should pass."""
        response = self.client.post(f'/api/assessment/quizzes/{self.quiz.id}/submit/', {
            'answers': [
                {'question_id': self.q1.id, 'answer_choice_id': self.q1_correct.id},
                {'question_id': self.q2.id, 'answer_choice_id': self.q2_correct.id},
            ]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['passed'])
        self.assertEqual(response.data['score'], 100.0)

    def test_wrong_answers_fail(self):
        """Submitting all wrong answers should fail."""
        response = self.client.post(f'/api/assessment/quizzes/{self.quiz.id}/submit/', {
            'answers': [
                {'question_id': self.q1.id, 'answer_choice_id': self.q1_wrong.id},
                {'question_id': self.q2.id, 'answer_choice_id': self.q2_wrong.id},
            ]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data['passed'])
        self.assertEqual(response.data['score'], 0.0)

    def test_foreign_question_rejected(self):
        """Submitting a question ID from another quiz should be rejected."""
        response = self.client.post(f'/api/assessment/quizzes/{self.quiz.id}/submit/', {
            'answers': [
                {'question_id': self.q1.id, 'answer_choice_id': self.q1_correct.id},
                {'question_id': 99999, 'answer_choice_id': self.q2_correct.id},
            ]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_foreign_answer_choice_rejected(self):
        """Submitting an answer choice from another quiz should be rejected."""
        response = self.client.post(f'/api/assessment/quizzes/{self.quiz.id}/submit/', {
            'answers': [
                {'question_id': self.q1.id, 'answer_choice_id': self.other_choice.id},
                {'question_id': self.q2.id, 'answer_choice_id': self.q2_correct.id},
            ]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
