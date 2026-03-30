import React, { useState, useEffect } from 'react';
import { markSimulationComplete } from '../../api/contentService';

const SimulationView = ({ lessonId, simulationUrl, textContent, onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(null);
  const [startTime] = useState(new Date());

  useEffect(() => {
    // Simulate loading time for iframe
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSimulationComplete = async () => {
    try {
      const endTime = new Date();
      const timeSpent = Math.round((endTime - startTime) / 1000); // Time in seconds
      
      setCompletionTime(timeSpent);
      setIsCompleted(true);

      // Mark simulation as completed in backend
      await markSimulationComplete(lessonId, timeSpent);
      
      // Call the completion callback
      if (onComplete) {
        onComplete({
          lessonId,
          timeSpent,
          completedAt: endTime.toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to mark simulation as complete:', err);
      setError('Failed to save completion status. Please try again.');
    }
  };

  const handleIframeError = () => {
    setError('Failed to load the simulation. Please check the URL and try again.');
    setIsLoading(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="space-y-6">
        {/* Completion Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Simulation Completed!
            </h3>
            <p className="text-green-700">
              Great job! You've successfully completed this interactive simulation.
            </p>
            {completionTime && (
              <p className="text-green-600 text-sm mt-2">
                Time spent: {Math.floor(completionTime / 60)}m {completionTime % 60}s
              </p>
            )}
          </div>
        </div>

        {/* Simulation iframe (read-only view) */}
        {simulationUrl && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Simulation (Completed)</span>
            </div>
            <iframe
              src={simulationUrl}
              title="Interactive Simulation"
              className="w-full h-96 border-0"
              allowFullScreen
            />
          </div>
        )}

        {/* Accompanying Text Content */}
        {textContent && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">
              Additional Information
            </h4>
            <div className="prose max-w-none">
              {textContent}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Learning
          </button>
          <button
            onClick={() => {
              setIsCompleted(false);
              setCompletionTime(null);
            }}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Replay Simulation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Interactive Simulation
        </h3>
        <p className="text-blue-700 mb-4">
          Complete the simulation below to progress to the next lesson. 
          Take your time to explore and understand the concepts.
        </p>
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <span>⏱️</span>
          <span>Time tracking is active</span>
        </div>
      </div>

      {/* Simulation iframe */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {isLoading && (
          <div className="flex items-center justify-center h-96 bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading simulation...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={simulationUrl}
          title="Interactive Simulation"
          className={`w-full h-96 border-0 ${isLoading ? 'hidden' : ''}`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allowFullScreen
        />
      </div>

      {/* Manual Completion Button */}
      <div className="text-center">
        <button
          onClick={handleSimulationComplete}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Mark as Complete
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Click this button when you've finished the simulation
        </p>
      </div>

      {/* Accompanying Text Content */}
      {textContent && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Additional Information
          </h4>
          <div className="prose max-w-none">
            {textContent}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">💡 Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Take your time to explore all features of the simulation</li>
          <li>• Try different scenarios to better understand the concepts</li>
          <li>• Use the "Mark as Complete" button when you're satisfied with your exploration</li>
        </ul>
      </div>
    </div>
  );
};

export default SimulationView; 