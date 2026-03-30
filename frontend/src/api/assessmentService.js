import apiClient from './api';

/**
 * Fetches a quiz by lesson ID.
 */
export const getQuizByLessonId = async (lessonId) => {
  try {
    const response = await apiClient.get(`/assessment/quizzes/?lesson=${lessonId}`);
    
    // Handle both response formats: direct array or results object
    let quizData;
    if (Array.isArray(response.data)) {
      // Backend returns direct array
      quizData = response.data;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      // Backend returns results object
      quizData = response.data.results;
    } else {
      throw new Error('Invalid response format from server');
    }
    
    if (quizData.length > 0) {
      return quizData[0]; // Return the first quiz for this lesson
    }
    throw new Error('No quiz found for this lesson');
  } catch (error) {
    console.error("Error fetching quiz:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch quiz.');
  }
};

/**
 * Submits a quiz with user answers.
 */
export const submitQuiz = async (quizId, answers) => {
  try {
    const response = await apiClient.post(`/assessment/quizzes/${quizId}/submit/`, {
      answers: answers
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting quiz:", error);
    throw new Error(error.response?.data?.detail || 'Could not submit quiz.');
  }
};

/**
 * Fetches user's quiz attempt history.
 */
export const getQuizAttempts = async () => {
  try {
    const response = await apiClient.get('/assessment/attempts/');
    return response.data.results || response.data;
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch quiz attempts.');
  }
};

/**
 * Fetches a specific quiz attempt by ID.
 */
export const getQuizAttemptById = async (attemptId) => {
  try {
    const response = await apiClient.get(`/assessment/attempts/${attemptId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching quiz attempt:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch quiz attempt.');
  }
}; 