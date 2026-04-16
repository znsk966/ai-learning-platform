import React from 'react';
import { Link } from 'react-router-dom';

const getLessonPath = (lesson) => {
  if (!lesson) {
    return null;
  }

  if (lesson.submodule_id) {
    return `/submodule/${lesson.submodule_id}/lesson/${lesson.id}`;
  }

  if (lesson.module_id) {
    return `/modules/${lesson.module_id}/lesson/${lesson.id}`;
  }

  return null;
};

const LessonCompletionPanel = ({
  title,
  description,
  nextLesson,
  backLink,
  backLabel = 'Back to lessons',
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const nextLessonPath = getLessonPath(nextLesson);

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-xl font-bold text-green-800 mb-2">{title}</h3>
          <p className="text-green-700">{description}</p>
        </div>
      </div>

      {nextLesson && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <p className="text-sm font-medium text-blue-700 mb-2">Next lesson unlocked</p>
          <h4 className="text-lg font-semibold text-blue-900">{nextLesson.title}</h4>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3">
        {nextLessonPath ? (
          <Link
            to={nextLessonPath}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Next Lesson
          </Link>
        ) : backLink ? (
          <Link
            to={backLink}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {backLabel}
          </Link>
        ) : null}

        {backLink && nextLessonPath && (
          <Link
            to={backLink}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {backLabel}
          </Link>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonCompletionPanel;