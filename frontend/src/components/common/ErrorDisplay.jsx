import React from 'react';

const ErrorDisplay = ({ title = 'Error', message, onRetry }) => {
  return (
    <div className="p-8">
      <div className="text-center text-red-600 bg-red-50 border border-red-200 p-6 rounded-lg max-w-md mx-auto">
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-2 text-red-500">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
