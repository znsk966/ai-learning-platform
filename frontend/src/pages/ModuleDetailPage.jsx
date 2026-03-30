import React, { useState, useEffect, useCallback } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { getModuleById } from '../api/contentService';
import EnrollmentStatus from '../components/payments/EnrollmentStatus';
import PaymentModal from '../components/payments/PaymentModal';
import { enrollFreeCourse } from '../api/paymentService';
import { LessonLockIcon as LockIcon, CheckIcon, PlayIcon } from '../components/common/Icons';
import { formatPrice } from '../utils/formatting';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const ModuleDetailPage = () => {
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  const fetchModule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getModuleById(moduleId);
      setModule(data);
    } catch (err) {
      console.error("Failed to fetch module details:", err);
      setError(err.message || 'Failed to load module. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchModule();
  }, [fetchModule]);

  const handleEnrollClick = async () => {
    if (module.is_free) {
      setIsEnrolling(true);
      try {
        await enrollFreeCourse(module.id);
        const data = await getModuleById(moduleId);
        setModule(data);
        setEnrollError('');
      } catch (error) {
        setEnrollError(error.message || 'Failed to enroll in course');
      } finally {
        setIsEnrolling(false);
      }
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    // Refresh module data
    const data = await getModuleById(moduleId);
    setModule(data);
  };

  if (loading) return <LoadingSpinner text="Loading module content..." />;
  if (error) return <ErrorDisplay title="Error Loading Module" message={error} onRetry={fetchModule} />;
  if (!module) return <ErrorDisplay title="Not Found" message="Module not found." />;

  const canAccess = module.can_access || module.is_enrolled;

  return (
    <div className="p-8">
      {/* Header with Pricing and Enrollment Status */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="mb-2 text-4xl font-bold">{module.title}</h1>
            <p className="text-lg text-gray-600">{module.description}</p>
          </div>
          <div className="ml-4 flex items-center gap-4">
            <EnrollmentStatus
              isEnrolled={module.is_enrolled}
              isFree={module.is_free}
              isPremiumOnly={module.is_premium_only}
              canAccess={canAccess}
            />
            {!module.is_enrolled && (
              <div className="text-right">
                {module.is_free ? (
                  <span className="text-2xl font-bold text-green-600">Free</span>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(parseFloat(module.price), module.currency)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enrollment Error */}
        {enrollError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {enrollError}
          </div>
        )}

        {/* Enrollment/Purchase Button */}
        {!module.is_enrolled && (
          <div className="mb-6">
            {canAccess ? (
              <p className="text-sm text-gray-600">
                You have access to this course. Start learning below!
              </p>
            ) : (
              <button
                onClick={handleEnrollClick}
                disabled={isEnrolling}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {isEnrolling ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enrolling...
                  </span>
                ) : module.is_free ? (
                  'Enroll Free'
                ) : (
                  `Purchase for ${formatPrice(parseFloat(module.price), module.currency)}`
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Course Content - Only show if user has access */}
      {canAccess ? (

        <div className="space-y-8">
          {module.submodules && module.submodules.length > 0 ? (
            module.submodules.map((submodule) => (
              <div key={submodule.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <NavLink 
                  to={`/submodule/${submodule.id}`}
                  className={({ isActive }) => `block transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <h2 className="text-2xl font-semibold p-6 bg-gray-50 border-b">{submodule.title}</h2>
                  <div className="p-6">
                    <p className="text-gray-600 mb-4">{submodule.description || 'Click to view lessons in this submodule.'}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{submodule.lessons?.length || 0} lessons</span>
                      <span className="text-blue-600">View lessons →</span>
                    </div>
                  </div>
                </NavLink>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              <p>No submodules available yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Access Required</h3>
              <p className="text-yellow-700 mb-4">
                {module.is_premium_only
                  ? 'This course is available for premium members only.'
                  : `You need to enroll in this course to access the content.`}
              </p>
              {module.is_free ? (
                <p className="text-sm text-yellow-600">This course is free. Click "Enroll Free" above to get started.</p>
              ) : (
                <p className="text-sm text-yellow-600">
                  Purchase this course for {formatPrice(parseFloat(module.price), module.currency)} to access all content.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          module={module}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default ModuleDetailPage;