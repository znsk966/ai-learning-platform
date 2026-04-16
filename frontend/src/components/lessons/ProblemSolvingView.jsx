import React, { useState } from 'react';
import { markProblemComplete } from '../../api/contentService';
import LessonCompletionPanel from './LessonCompletionPanel';

const ProblemSolvingView = ({ lessonId, problemContent, backLink, backLinkLabel = 'Back to lessons', onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showHints, setShowHints] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState(null);
  const [completionResult, setCompletionResult] = useState(null);
  const [startTime] = useState(new Date());

  // Parse problem content to extract steps, hints, and solutions
  const parseProblemContent = (content) => {
    try {
      // For now, we'll use a simple structure
      // In a real app, this would be structured data from the backend
      const lines = content.split('\n').filter(line => line.trim());
      const steps = [];
      const hints = [];
      const solutions = [];

      let currentSection = 'problem';
      
      lines.forEach(line => {
        if (line.startsWith('STEP:')) {
          currentSection = 'step';
          steps.push(line.replace('STEP:', '').trim());
        } else if (line.startsWith('HINT:')) {
          currentSection = 'hint';
          hints.push(line.replace('HINT:', '').trim());
        } else if (line.startsWith('SOLUTION:')) {
          currentSection = 'solution';
          solutions.push(line.replace('SOLUTION:', '').trim());
        } else {
          // Add to current section
          if (currentSection === 'step' && steps.length > 0) {
            steps[steps.length - 1] += '\n' + line;
          } else if (currentSection === 'hint' && hints.length > 0) {
            hints[hints.length - 1] += '\n' + line;
          } else if (currentSection === 'solution' && solutions.length > 0) {
            solutions[solutions.length - 1] += '\n' + line;
          }
        }
      });

      return {
        problem: lines.find(line => !line.startsWith('STEP:') && !line.startsWith('HINT:') && !line.startsWith('SOLUTION:')) || '',
        steps: steps.length > 0 ? steps : ['Solve the problem step by step'],
        hints: hints,
        solutions: solutions
      };
    } catch (err) {
      console.error('Error parsing problem content:', err);
      return {
        problem: content,
        steps: ['Solve the problem step by step'],
        hints: [],
        solutions: []
      };
    }
  };

  const problemData = parseProblemContent(problemContent);

  const handleAnswerChange = (stepIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [stepIndex]: answer
    }));
  };

  const toggleHint = (stepIndex) => {
    setShowHints(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  };

  const validateStep = (stepIndex) => {
    const userAnswer = userAnswers[stepIndex];
    const solution = problemData.solutions[stepIndex];
    
    if (!solution) return true; // No solution provided, assume correct
    
    // Simple validation - in a real app, this would be more sophisticated
    return userAnswer && userAnswer.trim().toLowerCase() === solution.trim().toLowerCase();
  };

  const handleStepComplete = (stepIndex) => {
    if (validateStep(stepIndex)) {
      if (stepIndex < problemData.steps.length - 1) {
        setCurrentStep(stepIndex + 1);
      } else {
        // All steps completed
        handleProblemComplete();
      }
    } else {
      setError('Please provide a valid answer before proceeding.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleProblemComplete = async () => {
    try {
      const endTime = new Date();
      const timeSpent = Math.round((endTime - startTime) / 1000);
      setError(null);

      // Mark problem as completed in backend
      const result = await markProblemComplete(lessonId, timeSpent, userAnswers);

      setCompletionResult(result);
      setIsCompleted(true);
      
      // Call the completion callback
      if (onComplete) {
        onComplete({
          lessonId,
          timeSpent,
          userAnswers,
          nextLesson: result.next_lesson,
          completedAt: endTime.toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to mark problem as complete:', err);
      setError('Failed to save completion status. Please try again.');
    }
  };

  const resetProblem = () => {
    setCurrentStep(0);
    setUserAnswers({});
    setShowHints({});
    setIsCompleted(false);
    setCompletionResult(null);
    setError(null);
  };

  if (isCompleted) {
    return (
      <LessonCompletionPanel
        title="Problem Solved"
        description="Excellent work. Your progress has been saved and the next lesson is unlocked."
        nextLesson={completionResult?.next_lesson}
        backLink={backLink}
        backLabel={backLinkLabel}
        secondaryActionLabel="Try Again"
        onSecondaryAction={resetProblem}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Problem Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Problem Solving Exercise
        </h3>
        <p className="text-blue-700">
          Work through this problem step by step. Take your time to think through each step carefully.
        </p>
        <div className="flex items-center justify-between mt-4 text-sm text-blue-600">
          <span>Step {currentStep + 1} of {problemData.steps.length}</span>
          <span>⏱️ Time tracking active</span>
        </div>
      </div>

      {/* Problem Statement */}
      {problemData.problem && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Problem
          </h4>
          <div className="prose max-w-none">
            {problemData.problem}
          </div>
        </div>
      )}

      {/* Current Step */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">
            Step {currentStep + 1}
          </h4>
          {problemData.hints[currentStep] && (
            <button
              onClick={() => toggleHint(currentStep)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showHints[currentStep] ? 'Hide Hint' : 'Show Hint'}
            </button>
          )}
        </div>

        <div className="mb-4">
          <p className="text-gray-700">{problemData.steps[currentStep]}</p>
        </div>

        {/* Hint */}
        {showHints[currentStep] && problemData.hints[currentStep] && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600">💡</span>
              <div>
                <p className="text-yellow-800 font-medium mb-1">Hint:</p>
                <p className="text-yellow-700">{problemData.hints[currentStep]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Answer Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer:
          </label>
          <textarea
            value={userAnswers[currentStep] || ''}
            onChange={(e) => handleAnswerChange(currentStep, e.target.value)}
            placeholder="Enter your answer for this step..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="4"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Step Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            Previous Step
          </button>

          <button
            onClick={() => handleStepComplete(currentStep)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {currentStep === problemData.steps.length - 1 ? 'Complete Problem' : 'Next Step'}
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Progress</h4>
        <div className="flex space-x-2">
          {problemData.steps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full ${
                index < currentStep
                  ? 'bg-green-500'
                  : index === currentStep
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Completed: {currentStep}</span>
          <span>Total: {problemData.steps.length}</span>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">💡 Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Read each step carefully before answering</li>
          <li>• Use the hints if you get stuck</li>
          <li>• You can go back to previous steps to review your answers</li>
          <li>• Take your time to think through each solution</li>
        </ul>
      </div>
    </div>
  );
};

export default ProblemSolvingView; 