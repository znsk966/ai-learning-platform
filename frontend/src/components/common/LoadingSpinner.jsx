import React from 'react';

const LoadingSpinner = ({ size = 'lg', text = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinner = (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600`}></div>
  );

  if (!text) return spinner;

  return (
    <div className="p-8">
      <div className="text-center">
        {React.cloneElement(spinner, { className: `${spinner.props.className} mx-auto` })}
        <p className="mt-4 text-gray-600">{text}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
