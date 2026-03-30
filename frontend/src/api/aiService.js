import apiClient from './api';

/**
 * Sends a question to the AI tutor for a specific lesson.
 */
export const askAI = async (lessonId, userQuestion, diyContext = '', aiConfig = null) => {
  try {
    const requestData = {
      lesson_id: lessonId,
      user_question: userQuestion,
      diy_context: diyContext
    };

    // Add AI config if available
    if (aiConfig) {
      requestData.ai_config = aiConfig;
    }

    const response = await apiClient.post('/ai/ask/', requestData);
    return response.data;
  } catch (error) {
    console.error("Error asking AI:", error);
    // Return error data if available for better error handling
    if (error.response?.data) {
      const errorData = error.response.data;
      // Re-throw with error data included
      const enhancedError = new Error(errorData.error || 'Could not get response from AI tutor.');
      enhancedError.response = error.response;
      enhancedError.data = errorData;
      throw enhancedError;
    }
    throw new Error(error.response?.data?.error || 'Could not get response from AI tutor.');
  }
};

/**
 * Gets AI tutor configuration for a specific lesson.
 */
export const getAITutorConfig = async (lessonId) => {
  try {
    const response = await apiClient.get(`/ai/config/${lessonId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching AI tutor config:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch AI tutor configuration.');
  }
};

/**
 * Gets conversation history for a specific lesson.
 */
export const getConversationHistory = async (lessonId) => {
  try {
    const response = await apiClient.get(`/ai/conversation/${lessonId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch conversation history.');
  }
};

/**
 * Clears conversation history for a specific lesson.
 */
export const clearConversationHistory = async (lessonId) => {
  try {
    const response = await apiClient.delete(`/ai/conversation/${lessonId}/`);
    return response.data;
  } catch (error) {
    console.error("Error clearing conversation history:", error);
    throw new Error(error.response?.data?.detail || 'Could not clear conversation history.');
  }
}; 