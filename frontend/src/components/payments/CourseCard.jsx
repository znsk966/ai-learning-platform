import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EnrollmentStatus from './EnrollmentStatus';
import PaymentModal from './PaymentModal';
import { formatPrice } from '../../utils/formatting';

const CourseCard = ({ module, onEnrollmentSuccess }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleEnrollClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (module.is_enrolled) {
      // Already enrolled, just navigate
      return;
    }
    
    if (module.is_free) {
      handleFreeEnrollment();
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleFreeEnrollment = async () => {
    setIsEnrolling(true);
    try {
      const { enrollFreeCourse } = await import('../../api/paymentService');
      await enrollFreeCourse(module.id);
      if (onEnrollmentSuccess) {
        onEnrollmentSuccess(module.id);
      }
    } catch (error) {
      console.error('Enrollment failed:', error.message);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (onEnrollmentSuccess) {
      onEnrollmentSuccess(module.id);
    }
  };

  return (
    <>
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1.5 ${module.is_enrolled ? 'bg-green-500' : module.is_free ? 'bg-blue-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 leading-snug pr-3 group-hover:text-blue-700 transition-colors">
              {module.title}
            </h2>
            <EnrollmentStatus
              isEnrolled={module.is_enrolled}
              isFree={module.is_free}
              isPremiumOnly={module.is_premium_only}
              canAccess={module.can_access}
            />
          </div>

          {/* Description */}
          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
            {module.description || 'No description available'}
          </p>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-4">
            {/* Price */}
            <div className="flex items-center justify-between mb-4">
              {module.is_free ? (
                <span className="text-lg font-bold text-green-600">Free</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(parseFloat(module.price), module.currency)}
                  </span>
                  {module.is_premium_only && (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                      Premium
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Button */}
            {module.is_enrolled || module.can_access ? (
              <Link
                to={`/modules/${module.id}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                {module.is_enrolled ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Continue Learning
                  </>
                ) : 'View Course'}
              </Link>
            ) : (
              <button
                onClick={handleEnrollClick}
                disabled={isEnrolling}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                {isEnrolling ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enrolling...
                  </>
                ) : module.is_free ? (
                  'Enroll Free'
                ) : (
                  'Purchase Course'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          module={module}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default CourseCard;
