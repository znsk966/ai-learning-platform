import React, { useState, useEffect } from 'react';
import { markSimulationComplete } from '../../api/contentService';
import LessonCompletionPanel from './LessonCompletionPanel';

const SimulationView = ({ lessonId, simulationUrl, textContent, backLink, backLinkLabel = 'Back to lessons', onComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(null);
  const [completionResult, setCompletionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());

  useEffect(() => {
    // Simulate loading time for iframe
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSimulationComplete = async () => {
    if (isSubmitting) {
      return;
    }

    try {
      const endTime = new Date();
      const timeSpent = Math.round((endTime - startTime) / 1000); // Time in seconds

      setIsSubmitting(true);
      setError(null);

      // Mark simulation as completed in backend
      const result = await markSimulationComplete(lessonId, timeSpent);

      setCompletionTime(timeSpent);
      setCompletionResult(result);
      setIsCompleted(true);
      
      // Call the completion callback
      if (onComplete) {
        onComplete({
          lessonId,
          timeSpent,
          nextLesson: result.next_lesson,
          completedAt: endTime.toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to mark simulation as complete:', err);
      setError('Failed to save completion status. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      <LessonCompletionPanel
        title="Simulation Completed"
        description={`Great job. Your progress has been saved.${completionTime ? ` Time spent: ${Math.floor(completionTime / 60)}m ${completionTime % 60}s.` : ''}`}
        nextLesson={completionResult?.next_lesson}
        backLink={backLink}
        backLabel={backLinkLabel}
        secondaryActionLabel="Replay Simulation"
        onSecondaryAction={() => {
          setIsCompleted(false);
          setCompletionTime(null);
          setCompletionResult(null);
        }}
      />
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
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          {isSubmitting ? 'Saving...' : 'Mark as Complete'}
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