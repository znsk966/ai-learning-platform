from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import CourseEnrollment, Lesson, Module, SubModule, UserLessonProgress


class LessonLockingTest(TestCase):
    """Tests for the lesson locking logic in ModuleViewSet.retrieve()."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_active=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create module with 2 submodules, each with 3 lessons
        self.module = Module.objects.create(title='Test Module', order=0, price=0.00)
        self.sub1 = SubModule.objects.create(module=self.module, title='Sub 1', order=0)
        self.sub2 = SubModule.objects.create(module=self.module, title='Sub 2', order=1)

        self.lessons = []
        for sub in [self.sub1, self.sub2]:
            for i in range(3):
                lesson = Lesson.objects.create(
                    submodule=sub, title=f'{sub.title} Lesson {i}', order=i
                )
                self.lessons.append(lesson)

    def _get_lesson_statuses(self):
        """Retrieve module and return list of (title, status) tuples."""
        response = self.client.get(f'/api/content/modules/{self.module.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        statuses = []
        for sub in response.data['submodules']:
            for lesson in sub['lessons']:
                statuses.append((lesson['title'], lesson.get('status', 'unknown')))
        return statuses

    def test_first_lesson_unlocked_rest_locked(self):
        """With no progress, only the very first lesson should be unlocked."""
        statuses = self._get_lesson_statuses()
        self.assertEqual(statuses[0][1], 'unlocked')
        for title, stat in statuses[1:]:
            self.assertEqual(stat, 'locked', f'{title} should be locked')

    def test_completing_first_lesson_unlocks_second(self):
        """Completing lesson 0 should unlock lesson 1."""
        UserLessonProgress.objects.create(user=self.user, lesson=self.lessons[0])
        statuses = self._get_lesson_statuses()
        self.assertEqual(statuses[0][1], 'completed')
        self.assertEqual(statuses[1][1], 'unlocked')
        for title, stat in statuses[2:]:
            self.assertEqual(stat, 'locked', f'{title} should be locked')

    def test_completing_submodule1_unlocks_first_lesson_of_submodule2(self):
        """Completing all of Sub 1 should unlock first lesson of Sub 2."""
        for lesson in self.lessons[:3]:
            UserLessonProgress.objects.create(user=self.user, lesson=lesson)
        statuses = self._get_lesson_statuses()
        # Sub 1 lessons all completed
        for title, stat in statuses[:3]:
            self.assertEqual(stat, 'completed', f'{title} should be completed')
        # Sub 2 lesson 0 should be unlocked
        self.assertEqual(statuses[3][1], 'unlocked')
        # Rest locked
        for title, stat in statuses[4:]:
            self.assertEqual(stat, 'locked', f'{title} should be locked')

    def test_all_completed(self):
        """Completing all lessons should show all as completed."""
        for lesson in self.lessons:
            UserLessonProgress.objects.create(user=self.user, lesson=lesson)
        statuses = self._get_lesson_statuses()
        for title, stat in statuses:
            self.assertEqual(stat, 'completed', f'{title} should be completed')


class LessonCompletionAccessTest(TestCase):
    """Tests for access checks on lesson completion endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_active=True)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.free_module = Module.objects.create(title='Free Module', order=0, price=0.00)
        self.paid_module = Module.objects.create(title='Paid Module', order=1, price=29.99)

        self.free_sub = SubModule.objects.create(module=self.free_module, title='Free Sub', order=0)
        self.paid_sub = SubModule.objects.create(module=self.paid_module, title='Paid Sub', order=0)

        self.free_lesson = Lesson.objects.create(
            submodule=self.free_sub, title='Free Lesson', order=0, lesson_type='SIM'
        )
        self.paid_lesson = Lesson.objects.create(
            submodule=self.paid_sub, title='Paid Lesson', order=0, lesson_type='SIM'
        )

    def test_complete_free_lesson_allowed(self):
        """Users can complete lessons in free modules."""
        response = self.client.post(
            f'/api/content/lessons/{self.free_lesson.id}/complete-simulation/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_complete_paid_lesson_without_enrollment_denied(self):
        """Users cannot complete lessons in paid modules without enrollment."""
        response = self.client.post(
            f'/api/content/lessons/{self.paid_lesson.id}/complete-simulation/'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_complete_paid_lesson_with_enrollment_allowed(self):
        """Users can complete lessons in paid modules when enrolled."""
        CourseEnrollment.objects.create(user=self.user, module=self.paid_module, is_active=True)
        response = self.client.post(
            f'/api/content/lessons/{self.paid_lesson.id}/complete-simulation/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ModuleAccessTest(TestCase):
    """Tests for module access control in list and retrieve."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123', is_active=True)
        self.anon_client = APIClient()
        self.auth_client = APIClient()
        self.auth_client.force_authenticate(user=self.user)

        self.free_module = Module.objects.create(title='Free Module', order=0, price=0.00)
        self.paid_module = Module.objects.create(title='Paid Module', order=1, price=29.99)

    def test_anon_can_list_modules(self):
        """Anonymous users can list modules."""
        response = self.anon_client.get('/api/content/modules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anon_can_access_free_module(self):
        """Anonymous users can view free module details."""
        response = self.anon_client.get(f'/api/content/modules/{self.free_module.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('can_access'))

    def test_anon_cannot_access_paid_module_content(self):
        """Anonymous users see empty submodules for paid modules."""
        SubModule.objects.create(module=self.paid_module, title='Sub', order=0)
        response = self.anon_client.get(f'/api/content/modules/{self.paid_module.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data.get('can_access'))
        self.assertEqual(response.data.get('submodules'), [])
