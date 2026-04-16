//src/pages/ModulesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getModules } from '../api/contentService';
import CourseCard from '../components/payments/CourseCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { useAuth } from '../store/authContext';

const parseModulesResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.modules)) return data.modules;
  if (data && typeof data === 'object') return [data];
  return [];
};

const ModulesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getModules();
      setModules(parseModulesResponse(data));
    } catch (err) {
      console.error("Failed to fetch modules:", err);
      setError(err.message || 'Failed to load modules. Please try again later.');
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleGuestSelect = (module) => {
    navigate('/login', {
      state: {
        from: { pathname: `/modules/${module.id}` },
        message: 'You must create an account first to view course chapters and lessons.',
        messageType: 'info',
      },
    });
  };

  if (loading) return <LoadingSpinner text="Loading modules..." />;
  if (error) return <ErrorDisplay title="Error Loading Modules" message={error} onRetry={fetchModules} />;

  if (!Array.isArray(modules) || modules.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Available Modules</h1>
          <p className="mt-1 text-sm text-gray-500">{isAuthenticated ? 'Browse courses and continue learning.' : 'Browse course titles as a guest. Create an account to open chapters and lessons.'}</p>
        </div>
        <div className="text-center text-gray-500 bg-white p-12 rounded-xl border border-gray-200">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-base font-medium text-gray-700">No modules available yet</p>
          <p className="mt-1 text-sm">Check back later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Available Modules</h1>
        <p className="mt-1 text-sm text-gray-500">{isAuthenticated ? 'Browse courses and continue learning.' : 'Browse course titles as a guest. Create an account to open chapters and lessons.'}</p>
      </div>
      {!isAuthenticated && (
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
          Guest access lets you browse course titles only. Open a course by creating an account first.
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <CourseCard
            key={module.id}
            module={module}
            onEnrollmentSuccess={() => fetchModules()}
            isGuestPreview={!isAuthenticated}
            onGuestSelect={handleGuestSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ModulesPage;
