import apiClient from './api';

/**
 * Fetches the list of all top-level modules.
 */
export const getModules = async () => {
  try {
    const response = await apiClient.get('/content/modules/');
    return response.data;
  } catch (error) {
    console.error("Error fetching modules:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch modules.');
  }
};

/**
 * Fetches the complete data for a single module by its ID.
 * This will now include the 'status' for each lesson.
 */
export const getModuleById = async (moduleId) => {
  try {
    const response = await apiClient.get(`/content/modules/${moduleId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching module with ID ${moduleId}:`, error);
    throw new Error(error.response?.data?.detail || 'Could not fetch module details.');
  }
};

/**
 * Fetches the complete data for a single submodule by its ID.
 * This will include the lessons with their status.
 */
export const getSubmoduleById = async (submoduleId) => {
  try {
    const response = await apiClient.get(`/content/submodules/${submoduleId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching submodule with ID ${submoduleId}:`, error);
    throw new Error(error.response?.data?.detail || 'Could not fetch submodule details.');
  }
};

/**
 * Fetches a single lesson by its ID.
 */
export const getLessonById = async (lessonId) => {
  try {
    const response = await apiClient.get(`/content/lessons/${lessonId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching lesson with ID ${lessonId}:`, error);
    throw new Error(error.response?.data?.detail || 'Could not fetch the lesson.');
  }
};

/**
 * Marks a specific lesson as viewed by the current user.
 */
export const markLessonAsViewed = async (lessonId) => {
    try {
        await apiClient.post(`/content/lessons/${lessonId}/view/`);
    } catch (error) {
        console.error(`Failed to mark lesson ${lessonId} as viewed:`, error);
    }
};

/**
 * Fetches the user's single next lesson to continue their learning path.
 * @returns {Promise<Object|null>} The next lesson object, or null if all are complete.
 */
export const getNextLesson = async () => {
    try {
        const response = await apiClient.get('/content/next-lesson/');
        // A 204 No Content response means the user has finished everything
        if (response.status === 204) {
            return null;
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching next lesson:", error);
        throw new Error(error.response?.data?.detail || 'Could not load next lesson.');
    }
};

  /**
   * Marks a non-quiz lesson as completed.
   */
  export const markLessonComplete = async (lessonId, payload = {}) => {
    try {
      const response = await apiClient.post(`/content/lessons/${lessonId}/complete/`, payload);
      return response.data;
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      throw new Error(error.response?.data?.detail || 'Could not mark lesson as complete.');
    }
  };

/**
 * Marks a simulation lesson as completed.
 */
export const markSimulationComplete = async (lessonId, timeSpent) => {
    return markLessonComplete(lessonId, {
      time_spent: timeSpent
    });
};

/**
 * Marks a problem-solving lesson as completed.
 */
export const markProblemComplete = async (lessonId, timeSpent, userAnswers) => {
    return markLessonComplete(lessonId, {
      time_spent: timeSpent,
      user_answers: userAnswers
    });
};

/**
 * Fetches comprehensive progress analytics for the enhanced dashboard.
 */
export const getProgressAnalytics = async () => {
    try {
        const response = await apiClient.get('/content/progress-analytics/');
        return response.data;
    } catch (error) {
        console.error("Error fetching progress analytics:", error);
        throw new Error(error.response?.data?.detail || 'Could not load progress analytics.');
    }
};