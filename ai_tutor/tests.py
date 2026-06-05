from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from assessment.models import AnswerChoice, Question, Quiz
from content.models import Lesson, Module, SubModule

from .models import AIChatUsage
from .views import AIAskView

User = get_user_model()


class AIAskViewTestBase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='learner', email='learner@example.com', password='pw12345', is_active=True
        )
        self.client.force_authenticate(user=self.user)

        self.module = Module.objects.create(title='M1', order=1)
        self.submodule = SubModule.objects.create(module=self.module, title='S1', order=1)
        self.url = reverse('ai-ask')

    def _make_lesson(self, **kwargs):
        defaults = {
            'submodule': self.submodule,
            'title': 'Lesson',
            'lesson_type': Lesson.LessonType.READING,
            'order': 1,
        }
        defaults.update(kwargs)
        return Lesson.objects.create(**defaults)


class HistoryHandlingTests(AIAskViewTestBase):
    @patch('ai_tutor.views.GEMINI_AVAILABLE', True)
    @patch.object(AIAskView, '_get_gemini_response')
    def test_history_is_incorporated(self, mock_gemini):
        mock_gemini.return_value = "Sure, here's more detail."
        lesson = self._make_lesson()

        history = [
            {'role': 'user', 'content': 'What is recursion?'},
            {'role': 'model', 'content': 'Recursion is a function calling itself.'},
        ]
        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'Explain that again',
            'history': history,
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        # _get_gemini_response(system_instruction, contents)
        _, contents = mock_gemini.call_args[0]
        texts = [p['text'] for turn in contents for p in turn['parts']]
        self.assertIn('What is recursion?', texts)
        self.assertIn('Recursion is a function calling itself.', texts)
        # Final turn is the current question
        self.assertEqual(contents[-1]['role'], 'user')
        self.assertEqual(contents[-1]['parts'][0]['text'], 'Explain that again')

    @patch('ai_tutor.views.GEMINI_AVAILABLE', True)
    @patch.object(AIAskView, '_get_gemini_response')
    def test_oversized_and_malformed_history_is_capped_and_ignored(self, mock_gemini):
        mock_gemini.return_value = "ok"
        lesson = self._make_lesson()

        history = []
        for i in range(20):
            history.append({'role': 'user', 'content': f'q{i}'})
        # Malformed entries that must be ignored
        history += [
            {'role': 'system', 'content': 'should be dropped'},
            {'role': 'user'},  # missing content
            {'content': 'no role'},
            'not a dict',
            {'role': 'model', 'content': ''},  # empty content
        ]

        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'next',
            'history': history,
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        _, contents = mock_gemini.call_args[0]
        # 10 capped history turns + 1 current question
        self.assertEqual(len(contents), 11)
        texts = [p['text'] for turn in contents for p in turn['parts']]
        self.assertNotIn('should be dropped', texts)
        self.assertNotIn('no role', texts)

    @patch('ai_tutor.views.GEMINI_AVAILABLE', True)
    @patch.object(AIAskView, '_get_gemini_response')
    def test_non_list_history_is_ignored(self, mock_gemini):
        mock_gemini.return_value = "ok"
        lesson = self._make_lesson()

        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'hi',
            'history': 'garbage',
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        _, contents = mock_gemini.call_args[0]
        self.assertEqual(len(contents), 1)  # only the current question


class SystemInstructionTests(AIAskViewTestBase):
    @patch('ai_tutor.views.GEMINI_AVAILABLE', True)
    @patch.object(AIAskView, '_get_gemini_response')
    def test_config_fields_appear_in_system_instruction(self, mock_gemini):
        mock_gemini.return_value = "ok"
        lesson = self._make_lesson()

        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'help',
            'ai_config': {
                'subject': 'Algorithms',
                'difficulty_level': 'Beginner',
                'teaching_style': 'Socratic',
                'preferred_explanation_length': 'two short paragraphs',
                'max_hints_per_question': 2,
            },
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        system_instruction = mock_gemini.call_args[0][0]
        self.assertIn('two short paragraphs', system_instruction)
        self.assertIn('at most 2 hints', system_instruction)
        self.assertIn('never state or confirm the correct answer', system_instruction)
        self.assertIn('Algorithms', system_instruction)

    @patch('ai_tutor.views.GEMINI_AVAILABLE', True)
    @patch.object(AIAskView, '_get_gemini_response')
    def test_read_lesson_text_is_injected(self, mock_gemini):
        mock_gemini.return_value = "ok"
        lesson = self._make_lesson(
            lesson_type=Lesson.LessonType.READING,
            text_content='Photosynthesis converts light into chemical energy.',
        )

        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'summarize',
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        system_instruction = mock_gemini.call_args[0][0]
        self.assertIn('Photosynthesis converts light into chemical energy.', system_instruction)

    @patch('ai_tutor.views.GEMINI_AVAILABLE', True)
    @patch.object(AIAskView, '_get_gemini_response')
    def test_quiz_answer_key_not_leaked_into_context(self, mock_gemini):
        mock_gemini.return_value = "ok"
        lesson = self._make_lesson(
            lesson_type=Lesson.LessonType.QUIZ,
            title='Capitals Quiz',
            text_content='',  # quiz text_content is typically empty
        )
        quiz = Quiz.objects.create(lesson=lesson, title='Capitals')
        question = Question.objects.create(quiz=quiz, question_text='Capital of France?', order=1)
        AnswerChoice.objects.create(question=question, answer_text='Paris', is_correct=True)
        AnswerChoice.objects.create(question=question, answer_text='Berlin', is_correct=False)

        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'give me a hint',
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        system_instruction = mock_gemini.call_args[0][0]
        self.assertNotIn('Paris', system_instruction)
        self.assertNotIn('Capital of France?', system_instruction)
        self.assertNotIn('Berlin', system_instruction)


class HonestFailureTests(AIAskViewTestBase):
    @override_settings(AI_TUTOR_ALLOW_SIMULATED=False)
    @patch('ai_tutor.views.GEMINI_AVAILABLE', True)
    @patch.object(AIAskView, '_get_gemini_response')
    def test_gemini_failure_returns_503_and_does_not_record_usage(self, mock_gemini):
        mock_gemini.side_effect = Exception('boom')
        lesson = self._make_lesson()

        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'hello',
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertTrue(resp.data.get('tutor_unavailable'))
        self.assertEqual(AIChatUsage.objects.filter(user=self.user).count(), 0)

    @override_settings(AI_TUTOR_ALLOW_SIMULATED=False)
    @patch('ai_tutor.views.GEMINI_AVAILABLE', False)
    def test_gemini_unavailable_returns_503_without_simulated(self):
        lesson = self._make_lesson()

        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'hello',
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(AIChatUsage.objects.filter(user=self.user).count(), 0)

    @override_settings(AI_TUTOR_ALLOW_SIMULATED=True)
    @patch('ai_tutor.views.GEMINI_AVAILABLE', False)
    def test_simulated_response_allowed_when_flag_enabled(self):
        lesson = self._make_lesson()

        resp = self.client.post(self.url, {
            'lesson_id': lesson.id,
            'user_question': 'hello',
        }, format='json')

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('ai_response', resp.data)
        self.assertEqual(AIChatUsage.objects.filter(user=self.user).count(), 1)
