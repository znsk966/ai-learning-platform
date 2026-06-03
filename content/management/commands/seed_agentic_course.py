"""
Idempotent seed command for the "Agentic AI Management" course (and similarly
shaped course seed files).

Usage:
    python manage.py seed_agentic_course
    python manage.py seed_agentic_course --file content/seed_data/module1_seed.json

This is a MANUAL operator step for local/dev use and for manual production runs
(e.g. `railway run python manage.py seed_agentic_course`). It is deliberately NOT
wired into any deploy hook. Re-running it must never create duplicates.
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from assessment.models import AnswerChoice, Question, Quiz
from content.models import Lesson, Module, SubModule

DEFAULT_SEED_FILE = "content/seed_data/module1_seed.json"

# Maps the seed file's lesson/question "type" codes to the model field values.
# These already match Lesson.LessonType / Question.QuestionType codes, but we
# resolve them explicitly so a bad code in the file fails loudly.
LESSON_TYPES = {code for code, _ in Lesson.LessonType.choices}
QUESTION_TYPES = {code for code, _ in Question.QuestionType.choices}


class Command(BaseCommand):
    help = "Idempotently seed a course (Module -> SubModule -> Lesson -> Quiz) from a JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            dest="file",
            default=DEFAULT_SEED_FILE,
            help=f"Path to the seed JSON file (default: {DEFAULT_SEED_FILE}).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        path = Path(options["file"])
        if not path.exists():
            raise CommandError(f"Seed file not found: {path}")

        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Could not parse JSON in {path}: {exc}") from exc

        course = data.get("course")
        if not course or not course.get("title"):
            raise CommandError("Seed file must contain a 'course' object with a 'title'.")

        # Running counters for the summary.
        counts = {
            "submodules_created": 0,
            "submodules_updated": 0,
            "lessons_created": 0,
            "lessons_updated": 0,
            "quizzes_created": 0,
            "quizzes_updated": 0,
            "questions": 0,
            "choices": 0,
        }

        module = self._upsert_module(course)

        for sub in data.get("submodules", []):
            submodule = self._upsert_submodule(module, sub, counts)
            for lesson_data in sub.get("lessons", []):
                self._upsert_lesson(submodule, lesson_data, counts)

        self._print_summary(module, counts)

    # --- Upsert helpers ---------------------------------------------------

    def _upsert_module(self, course):
        """Module is keyed by title (natural key)."""
        module, created = Module.objects.update_or_create(
            title=course["title"],
            defaults={
                "description": course.get("description", ""),
                "order": course.get("order", 0),
                "price": course.get("price", "0.00"),
                "currency": course.get("currency", "USD"),
                "is_premium_only": course.get("is_premium_only", False),
                "lemon_squeezy_variant_id": course.get("lemon_squeezy_variant_id"),
            },
        )
        verb = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} module: {module.title}"))
        return module

    def _upsert_submodule(self, module, sub, counts):
        """SubModule is keyed by (module, title)."""
        submodule, created = SubModule.objects.update_or_create(
            module=module,
            title=sub["title"],
            defaults={
                "description": sub.get("description", ""),
                "order": sub.get("order", 0),
            },
        )
        counts["submodules_created" if created else "submodules_updated"] += 1
        return submodule

    def _upsert_lesson(self, submodule, lesson_data, counts):
        """Lesson is keyed by (submodule, title)."""
        lesson_type = lesson_data["type"]
        if lesson_type not in LESSON_TYPES:
            raise CommandError(
                f"Unknown lesson type '{lesson_type}' for lesson '{lesson_data.get('title')}'."
            )

        defaults = {
            "lesson_type": lesson_type,
            "order": lesson_data.get("order", 0),
            "ai_tutor_initial_prompt": lesson_data.get("ai_tutor_initial_prompt", ""),
        }

        # READ lessons: join the step list with the ReadingView page separator.
        if lesson_type == Lesson.LessonType.READING:
            steps = lesson_data.get("text_content_steps", [])
            defaults["text_content"] = "\n\n---\n\n".join(steps)

        lesson, created = Lesson.objects.update_or_create(
            submodule=submodule,
            title=lesson_data["title"],
            defaults=defaults,
        )
        counts["lessons_created" if created else "lessons_updated"] += 1

        if lesson_type == Lesson.LessonType.QUIZ:
            self._upsert_quiz(lesson, lesson_data.get("quiz", {}), counts)

        return lesson

    def _upsert_quiz(self, lesson, quiz_data, counts):
        """Quiz is keyed by its OneToOne lesson. Questions/choices are rebuilt."""
        if not quiz_data:
            raise CommandError(f"QUIZ lesson '{lesson.title}' is missing its 'quiz' object.")

        quiz, created = Quiz.objects.update_or_create(
            lesson=lesson,
            defaults={
                "title": quiz_data.get("title", lesson.title),
                "passing_score": quiz_data.get("passing_score", 80),
            },
        )
        counts["quizzes_created" if created else "quizzes_updated"] += 1

        # Idempotent approach: delete existing questions (cascades to choices)
        # and recreate them from the file. This avoids drift on re-runs.
        quiz.questions.all().delete()

        for q in quiz_data.get("questions", []):
            q_type = q.get("type", Question.QuestionType.MULTIPLE_CHOICE)
            if q_type not in QUESTION_TYPES:
                raise CommandError(
                    f"Unknown question type '{q_type}' in quiz '{quiz.title}'."
                )
            question = Question.objects.create(
                quiz=quiz,
                question_text=q["question_text"],
                question_type=q_type,
                order=q.get("order", 0),
                explanation=q.get("explanation", ""),
            )
            counts["questions"] += 1

            choices = [
                AnswerChoice(
                    question=question,
                    answer_text=c["answer_text"],
                    is_correct=c.get("is_correct", False),
                )
                for c in q.get("choices", [])
            ]
            AnswerChoice.objects.bulk_create(choices)
            counts["choices"] += len(choices)

    # --- Output -----------------------------------------------------------

    def _print_summary(self, module, counts):
        self.stdout.write(self.style.SUCCESS("\nSeed complete:"))
        self.stdout.write(f"  Course:      {module.title}")
        self.stdout.write(
            f"  SubModules:  {counts['submodules_created']} created, "
            f"{counts['submodules_updated']} updated"
        )
        self.stdout.write(
            f"  Lessons:     {counts['lessons_created']} created, "
            f"{counts['lessons_updated']} updated"
        )
        self.stdout.write(
            f"  Quizzes:     {counts['quizzes_created']} created, "
            f"{counts['quizzes_updated']} updated"
        )
        self.stdout.write(
            f"  Questions:   {counts['questions']} (re)created "
            f"with {counts['choices']} choices"
        )
