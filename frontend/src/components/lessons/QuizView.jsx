import React, { useState, useEffect } from 'react';
import { getQuizByLessonId, submitQuiz } from '../../api/assessmentService';

const QuizView = ({ lessonId, onQuizComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // New state for step-by-step interface
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizData = await getQuizByLessonId(lessonId);
        setQuiz(quizData);
        // Initialize answers object
        const initialAnswers = {};
        quizData.questions.forEach(question => {
          initialAnswers[question.id] = null;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Failed to fetch quiz:', err);
        setError('Could not load the quiz. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [lessonId]);

  const handleAnswerSelect = (questionId, answerChoiceId) => {
    console.log('Selecting answer:', { questionId, answerChoiceId });
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answerChoiceId
      };
      console.log('Updated answers:', newAnswers);
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unansweredQuestions = quiz.questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      setError(`Please answer all questions. You have ${unansweredQuestions.length} unanswered question(s).`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Format answers for API
      const formattedAnswers = Object.entries(answers).map(([questionId, answerChoiceId]) => ({
        question_id: parseInt(questionId),
        answer_choice_id: answerChoiceId
      }));

      console.log('Submitting quiz with answers:', formattedAnswers);
      const result = await submitQuiz(quiz.id, formattedAnswers);
      console.log('Quiz submission result:', result);
      setResults(result);
      setShowResults(true);
      
      // Call the callback if quiz was passed
      if (result.passed && onQuizComplete) {
        onQuizComplete(result);
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setShowResults(false);
    setResults(null);
    setError(null);
    setCurrentQuestionIndex(0);
    // Reset answers
    const initialAnswers = {};
    quiz.questions.forEach(question => {
      initialAnswers[question.id] = null;
    });
    setAnswers(initialAnswers);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading quiz...</span>
      </div>
    );
  }

  if (error && !showResults) {
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

  if (!quiz) {
    return (
      <div className="p-6 text-center text-gray-600">
        No quiz found for this lesson.
      </div>
    );
  }

  if (showResults && results) {
    console.log('Quiz results:', results);
    
    return (
      <div className="space-y-6 min-h-screen">
        {/* Results Header */}
        <div className={`p-6 rounded-lg border-2 ${
          results.passed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="text-center">
            <h3 className={`text-2xl font-bold mb-2 ${
              results.passed ? 'text-green-800' : 'text-red-800'
            }`}>
              {results.passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}
            </h3>
            <p className={`text-lg ${
              results.passed ? 'text-green-700' : 'text-red-700'
            }`}>
              Your Score: {results.score.toFixed(1)}%
            </p>
            <p className={`text-sm ${
              results.passed ? 'text-green-600' : 'text-red-600'
            }`}>
              Passing Score: {quiz.passing_score}%
            </p>
            {results.passed && (
              <p className="text-green-700 font-medium mt-2">
                ✅ You've unlocked the next lesson!
              </p>
            )}
          </div>
        </div>

        {/* Question Results */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Question Review</h4>
          {results.questions && results.questions.length > 0 ? (
            results.questions.map((question, index) => {
              const userChoice = question.choices?.find(choice => choice.id === question.user_answer);
              const correctChoice = question.choices?.find(choice => choice.is_correct);
              const isCorrect = userChoice?.is_correct;

              return (
                <div key={question.id} className={`p-4 rounded-lg border ${
                  isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start space-x-2 mb-3">
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <h5 className="font-medium text-gray-800">
                      Question {index + 1}: {question.question_text}
                    </h5>
                  </div>
                  
                  <div className="space-y-2 ml-6">
                    {question.choices && question.choices.map(choice => (
                      <div key={choice.id} className={`p-2 rounded ${
                        choice.is_correct 
                          ? 'bg-green-100 border border-green-300' 
                          : choice.id === question.user_answer && !choice.is_correct
                          ? 'bg-red-100 border border-red-300'
                          : 'bg-gray-50 border border-gray-200'
                      }`}>
                        <span className={`font-medium ${
                          choice.is_correct 
                            ? 'text-green-800' 
                            : choice.id === question.user_answer && !choice.is_correct
                            ? 'text-red-800'
                            : 'text-gray-600'
                        }`}>
                          {choice.answer_text}
                        </span>
                        {choice.is_correct && (
                          <span className="ml-2 text-green-600 text-sm">✓ Correct Answer</span>
                        )}
                        {choice.id === question.user_answer && !choice.is_correct && (
                          <span className="ml-2 text-red-600 text-sm">✗ Your Answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">No question details available for review.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 pt-4">
          {!results.passed && (
            <button
              onClick={handleRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Lesson
          </button>
        </div>
      </div>
    );
  }

  // Step-by-step quiz interface
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.values(answers).filter(answer => answer !== null).length;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const canProceed = answers[currentQuestion.id] !== null;

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{quiz.title}</h2>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <span>Passing Score: {quiz.passing_score}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
        
        <p className="text-gray-700 text-sm">
          {answeredCount} of {quiz.questions.length} questions answered
        </p>
      </div>

      {/* Current Question */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-medium text-gray-800 mb-6">
          Question {currentQuestionIndex + 1}: {currentQuestion.question_text}
        </h3>
        
        <div className="space-y-3">
          {currentQuestion.choices.map(choice => (
            <label
              key={choice.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                answers[currentQuestion.id] === choice.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={choice.id}
                checked={answers[currentQuestion.id] === choice.id}
                onChange={() => handleAnswerSelect(currentQuestion.id, choice.id)}
                className="sr-only"
              />
              <div className={`w-5 h-5 border-2 rounded-full mr-4 flex items-center justify-center ${
                answers[currentQuestion.id] === choice.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {answers[currentQuestion.id] === choice.id && (
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                )}
              </div>
              <span className="text-gray-700 text-lg">{choice.answer_text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            currentQuestionIndex === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          ← Previous
        </button>

        <div className="flex space-x-3">
          {!isLastQuestion ? (
            <button
              onClick={handleNextQuestion}
              disabled={!canProceed}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                !canProceed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceed}
              className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                submitting || !canProceed
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit Quiz'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Question Navigation Dots */}
      <div className="flex justify-center space-x-2 pt-4">
        {quiz.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentQuestionIndex
                ? 'bg-blue-600'
                : answers[quiz.questions[index].id]
                ? 'bg-green-500'
                : 'bg-gray-300'
            }`}
            title={`Question ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default QuizView; 