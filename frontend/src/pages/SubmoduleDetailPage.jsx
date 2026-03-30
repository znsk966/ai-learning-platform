import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { getSubmoduleById } from '../api/contentService';
import { LessonLockIcon as LockIcon, CheckIcon, PlayIcon } from '../components/common/Icons';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const SubmoduleDetailPage = () => {
  const { submoduleId } = useParams();
  const [submodule, setSubmodule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubmodule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSubmoduleById(submoduleId);
      setSubmodule(data);
    } catch (err) {
      console.error("Failed to fetch submodule details:", err);
      setError(err.message || 'Failed to load submodule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [submoduleId]);

  useEffect(() => {
    fetchSubmodule();
  }, [fetchSubmodule]);

  if (loading) return <LoadingSpinner text="Loading submodule content..." />;
  if (error) return <ErrorDisplay title="Error Loading Submodule" message={error} onRetry={fetchSubmodule} />;
  if (!submodule) return <ErrorDisplay title="Not Found" message="Submodule not found." />;

  return (
    <div className="p-8">
      <h1 className="mb-2 text-4xl font-bold">{submodule.title}</h1>
      <p className="mb-10 text-lg text-gray-600">{submodule.description}</p>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-2xl font-semibold p-6 bg-gray-50 border-b">Lessons</h2>
        <ul className="divide-y divide-gray-200">
          {submodule.lessons.map((lesson) => (
            <li key={lesson.id}>
              {lesson.status === 'locked' ? (
                <span className="flex items-center p-4 text-gray-500 cursor-not-allowed">
                  <LockIcon /> {lesson.title}
                </span>
              ) : (
                <NavLink 
                  to={`/submodule/${submoduleId}/lesson/${lesson.id}`}
                  className={({ isActive }) => `flex items-center p-4 transition-colors text-gray-700 ${isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}
                >
                  {lesson.status === 'completed' ? <CheckIcon /> : <PlayIcon />}
                  <span className="flex-grow">{lesson.title}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SubmoduleDetailPage;
