# ai-powered-learning/content/views.py

from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.permissions import IsAdminOrReadOnly

from .models import CourseEnrollment, Lesson, Module, Profile, SubModule, UserLessonProgress
from .serializers import DashboardSerializer, LessonSerializer, ModuleSerializer, SubModuleSerializer


# --- CORRECTED ModuleViewSet with Locking Logic ---
class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all().order_by('order')
    serializer_class = ModuleSerializer
    permission_classes = [IsAdminOrReadOnly]

    def retrieve(self, request, *args, **kwargs):
        """
        Overrides the default retrieve method to add lesson locking status and check access permissions.
        """
        instance = self.get_object()
        user = request.user

        # Check enrollment and access permissions
        is_enrolled = False
        if user.is_authenticated:
            is_enrolled = CourseEnrollment.objects.filter(
                user=user,
                module=instance,
                is_active=True
            ).exists()

        # Check if user can access (enrolled OR (free course) OR (premium user and premium-only course))
        can_access = False
        if user.is_authenticated:
            try:
                profile, _ = Profile.objects.get_or_create(user=user)
                can_access = (
                    is_enrolled or
                    instance.is_free or
                    (instance.is_premium_only and profile.is_premium)
                )
            except Exception:
                # If profile creation fails, default to free access only
                can_access = instance.is_free
        else:
            # Anonymous users can only access free courses
            can_access = instance.is_free

        # If user cannot access, return limited information
        if not can_access and not (user.is_authenticated and user.is_staff):
            serializer = self.get_serializer(instance)
            data = serializer.data
            # Remove submodules if user doesn't have access
            data['submodules'] = []
            data['is_enrolled'] = is_enrolled
            data['can_access'] = False
            data['is_free'] = instance.is_free
            return Response(data)

        # Get all IDs of lessons completed by the user
        completed_lesson_ids = set()
        if user.is_authenticated:
            completed_lesson_ids = set(
                UserLessonProgress.objects.filter(user=user).values_list('lesson_id', flat=True)
            )

        # Prefetch all lessons in global order to avoid N+1 and ensure correct locking
        all_lessons = Lesson.objects.filter(
            submodule__module=instance
        ).select_related('submodule').order_by('submodule__order', 'order')

        # Build a lookup of lesson status across the entire module
        unlocked_lesson_found = False
        lesson_status_map = {}
        for lesson in all_lessons:
            if lesson.id in completed_lesson_ids:
                lesson_status_map[lesson.id] = 'completed'
            elif not unlocked_lesson_found:
                lesson_status_map[lesson.id] = 'unlocked'
                unlocked_lesson_found = True
            else:
                lesson_status_map[lesson.id] = 'locked'

        # Pass status map to serializer via context
        serializer = self.get_serializer(instance, context={
            'request': request,
            'lesson_status_map': lesson_status_map,
        })
        data = serializer.data
        data['is_enrolled'] = is_enrolled
        data['can_access'] = can_access
        data['is_free'] = instance.is_free
        return Response(data)

    def list(self, request, *args, **kwargs):
        """
        Override list to add enrollment and access information.
        """
        response = super().list(request, *args, **kwargs)
        user = request.user

        # Handle paginated response (response.data is a dict with 'results') or list response
        modules_list = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data

        if not isinstance(modules_list, list):
            # If it's not a list, something went wrong, return as-is
            return response

        # Fetch all modules referenced in the response in one query
        module_ids = [m.get('id') for m in modules_list if m.get('id')]
        modules_by_id = {m.id: m for m in Module.objects.filter(id__in=module_ids)}

        if user.is_authenticated:
            # Get all enrollments for this user
            enrolled_module_ids = set(
                CourseEnrollment.objects.filter(
                    user=user,
                    is_active=True
                ).values_list('module_id', flat=True)
            )

            # Get user profile for premium check
            try:
                profile, _ = Profile.objects.get_or_create(user=user)
            except Exception:
                profile = None

            # Add enrollment and access info to each module
            for module_data in modules_list:
                module = modules_by_id.get(module_data.get('id'))
                if not module:
                    continue

                is_enrolled = module.id in enrolled_module_ids
                can_access = (
                    is_enrolled or
                    module.is_free or
                    (module.is_premium_only and profile and profile.is_premium)
                )
                module_data['is_enrolled'] = is_enrolled
                module_data['can_access'] = can_access
                module_data['is_free'] = module.is_free
        else:
            # For anonymous users, only show free courses as accessible
            for module_data in modules_list:
                module = modules_by_id.get(module_data.get('id'))
                if not module:
                    continue

                module_data['is_enrolled'] = False
                module_data['can_access'] = module.is_free
                module_data['is_free'] = module.is_free

        # Update response.data with modified modules_list
        if isinstance(response.data, dict):
            response.data['results'] = modules_list
        else:
            response.data = modules_list

        return response


# --- Other ViewSets and Views (No changes needed below this line) ---

class SubModuleViewSet(viewsets.ModelViewSet):
    queryset = SubModule.objects.all().order_by('order')
    serializer_class = SubModuleSerializer
    filterset_fields = ['module']
    permission_classes = [IsAdminOrReadOnly]

    def retrieve(self, request, *args, **kwargs):
        """
        Overrides the default retrieve method to add lesson locking status.
        """
        instance = self.get_object()
        user = request.user

        # Get all IDs of lessons completed by the user
        completed_lesson_ids = set(
            UserLessonProgress.objects.filter(user=user).values_list('lesson_id', flat=True)
        )

        # This flag will track if we've found the next lesson to be unlocked
        unlocked_lesson_found = False
        lesson_status_map = {}

        # Iterate through the submodule lessons to set the status for each lesson
        for lesson in instance.lessons.all():
            if lesson.id in completed_lesson_ids:
                lesson_status_map[lesson.id] = 'completed'
            elif not unlocked_lesson_found:
                lesson_status_map[lesson.id] = 'unlocked'
                unlocked_lesson_found = True
            else:
                lesson_status_map[lesson.id] = 'locked'

        serializer = self.get_serializer(instance, context={
            'request': request,
            'lesson_status_map': lesson_status_map,
        })
        return Response(serializer.data)

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all().order_by('order')
    serializer_class = LessonSerializer
    filterset_fields = ['submodule']
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=['post'], url_path='view', permission_classes=[IsAuthenticated])
    def mark_as_viewed(self, request, pk=None):
        lesson = self.get_object()
        user = request.user
        profile, created = Profile.objects.get_or_create(user=user)
        profile.last_viewed_lesson = lesson
        profile.save()
        return Response({'status': 'lesson marked as viewed'}, status=status.HTTP_200_OK)

    def _check_lesson_access(self, user, lesson):
        """Verify the user has access to the lesson's module (enrolled or free)."""
        module = lesson.submodule.module
        if module.is_free:
            return True
        return CourseEnrollment.objects.filter(
            user=user, module=module, is_active=True
        ).exists()

    @action(detail=True, methods=['post'], url_path='complete-simulation', permission_classes=[IsAuthenticated])
    def complete_simulation(self, request, pk=None):
        lesson = self.get_object()
        user = request.user

        if not self._check_lesson_access(user, lesson):
            return Response(
                {'detail': 'You do not have access to this lesson.'},
                status=status.HTTP_403_FORBIDDEN
            )

        time_spent = request.data.get('time_spent', 0)
        UserLessonProgress.objects.get_or_create(user=user, lesson=lesson)

        return Response({
            'status': 'simulation completed',
            'time_spent': time_spent
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='complete-problem', permission_classes=[IsAuthenticated])
    def complete_problem(self, request, pk=None):
        lesson = self.get_object()
        user = request.user

        if not self._check_lesson_access(user, lesson):
            return Response(
                {'detail': 'You do not have access to this lesson.'},
                status=status.HTTP_403_FORBIDDEN
            )

        time_spent = request.data.get('time_spent', 0)
        user_answers = request.data.get('user_answers', {})
        UserLessonProgress.objects.get_or_create(user=user, lesson=lesson)

        return Response({
            'status': 'problem completed',
            'time_spent': time_spent,
            'user_answers': user_answers
        }, status=status.HTTP_200_OK)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        profile, created = Profile.objects.get_or_create(user=user)

        # This logic is now based on completion, not just viewing
        lessons_completed_count = UserLessonProgress.objects.filter(user=user).count()
        modules_completed_count = Module.objects.filter(
            id__in=UserLessonProgress.objects.filter(user=user).values_list('lesson__submodule__module_id', flat=True)
        ).distinct().count()

        profile_data = DashboardSerializer(instance=profile).data

        profile_data['stats'] = {
            'modules_completed': modules_completed_count,
            'lessons_completed': lessons_completed_count,
            'average_score': "N/A"
        }

        return Response(profile_data)

# --- ADD THIS NEW VIEW AT THE END OF THE FILE ---
class NextLessonView(APIView):
    """
    Finds the very next lesson the user should take.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        completed_lesson_ids = set(UserLessonProgress.objects.filter(user=user).values_list('lesson_id', flat=True))

        # Find the first lesson that is not in the completed set, respecting the global order.
        next_lesson = Lesson.objects.exclude(id__in=completed_lesson_ids).order_by('submodule__module__order', 'submodule__order', 'order').first()

        if next_lesson:
            # We can reuse the ContinueLearningLessonSerializer
            from .serializers import ContinueLearningLessonSerializer
            serializer = ContinueLearningLessonSerializer(instance=next_lesson)
            return Response(serializer.data)
        else:
            # User has completed all lessons
            return Response({"detail": "Congratulations! You have completed all lessons."}, status=status.HTTP_204_NO_CONTENT)


class ProgressAnalyticsView(APIView):
    """
    Comprehensive progress analytics for the enhanced dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user

        # Get user's completed lessons
        completed_lessons = UserLessonProgress.objects.filter(user=user)
        completed_lesson_ids = set(completed_lessons.values_list('lesson_id', flat=True))

        # Get user's enrollments
        enrollments = CourseEnrollment.objects.filter(user=user, is_active=True).select_related('module')
        enrolled_module_ids = set(enrollments.values_list('module_id', flat=True))

        # Get all lessons for comparison (only from enrolled modules or free modules for progress calculation)
        enrolled_or_free_modules = Module.objects.filter(
            Q(id__in=enrolled_module_ids) | Q(price=0.00)
        )
        all_lessons = Lesson.objects.filter(submodule__module__in=enrolled_or_free_modules)
        total_lessons = all_lessons.count()
        completed_count = len(completed_lesson_ids)

        # Calculate overall progress percentage (only for enrolled/free courses)
        overall_progress = (completed_count / total_lessons * 100) if total_lessons > 0 else 0

        # Progress by module (show all modules, but mark enrollment status)
        all_modules = Module.objects.all()
        module_progress = []
        for module in all_modules:
            module_lessons = Lesson.objects.filter(submodule__module=module)
            module_total = module_lessons.count()
            module_completed = module_lessons.filter(id__in=completed_lesson_ids).count()
            module_percentage = (module_completed / module_total * 100) if module_total > 0 else 0

            # Get enrollment info
            enrollment = enrollments.filter(module=module).first()
            is_enrolled = module.id in enrolled_module_ids

            module_progress.append({
                'id': module.id,
                'title': module.title,
                'total_lessons': module_total,
                'completed_lessons': module_completed,
                'percentage': round(module_percentage, 1),
                'is_completed': module_completed == module_total,
                'is_enrolled': is_enrolled,
                'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment else None,
                'is_free': module.is_free,
                'price': float(module.price) if not module.is_free else 0
            })

        # Progress by lesson type
        lesson_type_progress = []
        for lesson_type, lesson_type_name in Lesson.LessonType.choices:
            type_lessons = all_lessons.filter(lesson_type=lesson_type)
            type_total = type_lessons.count()
            type_completed = type_lessons.filter(id__in=completed_lesson_ids).count()
            type_percentage = (type_completed / type_total * 100) if type_total > 0 else 0

            lesson_type_progress.append({
                'type': lesson_type,
                'name': lesson_type_name,
                'total': type_total,
                'completed': type_completed,
                'percentage': round(type_percentage, 1)
            })

        # Recent activity (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_completions = completed_lessons.filter(completed_at__gte=seven_days_ago)
        recent_lessons = recent_completions.select_related('lesson__submodule__module').order_by('-completed_at')[:5]

        recent_activity = []
        for progress in recent_lessons:
            recent_activity.append({
                'lesson_title': progress.lesson.title,
                'module_title': progress.lesson.submodule.module.title,
                'submodule_title': progress.lesson.submodule.title,
                'lesson_type': progress.lesson.get_lesson_type_display(),
                'completed_at': progress.completed_at,
                'days_ago': (timezone.now() - progress.completed_at).days
            })

        # Study streak calculation
        streak = 0
        current_date = timezone.now().date()
        check_date = current_date

        while True:
            daily_completions = completed_lessons.filter(
                completed_at__date=check_date
            ).exists()

            if daily_completions:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        # Achievement badges
        achievements = []

        # First lesson completed
        if completed_count >= 1:
            achievements.append({
                'id': 'first_lesson',
                'title': 'First Steps',
                'description': 'Completed your first lesson',
                'icon': '🎯',
                'earned': True
            })

        # 10 lessons completed
        if completed_count >= 10:
            achievements.append({
                'id': 'ten_lessons',
                'title': 'Dedicated Learner',
                'description': 'Completed 10 lessons',
                'icon': '📚',
                'earned': True
            })

        # Module completion
        completed_modules = [m for m in module_progress if m['is_completed']]
        if completed_modules:
            achievements.append({
                'id': 'module_complete',
                'title': 'Module Master',
                'description': f'Completed {len(completed_modules)} module(s)',
                'icon': '🏆',
                'earned': True
            })

        # Study streak
        if streak >= 3:
            achievements.append({
                'id': 'streak_3',
                'title': 'Consistent Learner',
                'description': f'Maintained a {streak}-day study streak',
                'icon': '🔥',
                'earned': True
            })

        # Add unearned achievements for motivation
        if completed_count < 10:
            achievements.append({
                'id': 'ten_lessons',
                'title': 'Dedicated Learner',
                'description': 'Complete 10 lessons',
                'icon': '📚',
                'earned': False
            })

        if streak < 3:
            achievements.append({
                'id': 'streak_3',
                'title': 'Consistent Learner',
                'description': 'Maintain a 3-day study streak',
                'icon': '🔥',
                'earned': False
            })

        # Next milestones
        next_milestones = []
        if completed_count < 10:
            next_milestones.append({
                'type': 'lessons',
                'target': 10,
                'current': completed_count,
                'description': 'Complete 10 lessons'
            })

        if streak < 7:
            next_milestones.append({
                'type': 'streak',
                'target': 7,
                'current': streak,
                'description': 'Maintain a 7-day study streak'
            })

        # Get next lesson for quick access
        next_lesson = Lesson.objects.exclude(id__in=completed_lesson_ids).order_by(
            'submodule__module__order', 'submodule__order', 'order'
        ).first()

        next_lesson_data = None
        if next_lesson:
            next_lesson_data = {
                'id': next_lesson.id,
                'title': next_lesson.title,
                'module_title': next_lesson.submodule.module.title,
                'submodule_title': next_lesson.submodule.title,
                'lesson_type': next_lesson.get_lesson_type_display(),
                'url': f'/submodule/{next_lesson.submodule.id}/lesson/{next_lesson.id}'
            }

        # Get enrolled courses info
        enrolled_courses = []
        for enrollment in enrollments.order_by('-enrolled_at')[:5]:
            module = enrollment.module
            module_lessons = Lesson.objects.filter(submodule__module=module)
            module_completed = module_lessons.filter(id__in=completed_lesson_ids).count()
            module_total = module_lessons.count()
            module_percentage = (module_completed / module_total * 100) if module_total > 0 else 0

            enrolled_courses.append({
                'id': module.id,
                'title': module.title,
                'enrolled_at': enrollment.enrolled_at.isoformat(),
                'days_since_enrollment': (timezone.now() - enrollment.enrolled_at).days,
                'progress': {
                    'completed_lessons': module_completed,
                    'total_lessons': module_total,
                    'percentage': round(module_percentage, 1)
                },
                'is_free': module.is_free,
                'price': float(module.price) if not module.is_free else 0
            })

        return Response({
            'overall_progress': {
                'total_lessons': total_lessons,
                'completed_lessons': completed_count,
                'percentage': round(overall_progress, 1)
            },
            'module_progress': module_progress,
            'lesson_type_progress': lesson_type_progress,
            'recent_activity': recent_activity,
            'study_streak': streak,
            'achievements': achievements,
            'next_milestones': next_milestones,
            'next_lesson': next_lesson_data,
            'enrolled_courses': enrolled_courses,
            'enrollment_stats': {
                'total_enrolled': len(enrolled_module_ids),
                'total_free': Module.objects.filter(price=0.00).count(),
                'total_paid': Module.objects.exclude(price=0.00).count()
            },
            'stats': {
                'total_modules': Module.objects.count(),
                'total_submodules': SubModule.objects.count(),
                'days_since_start': (timezone.now() - user.date_joined).days,
                'enrolled_modules': len(enrolled_module_ids)
            }
        })

