import apiClient from './api';

/**
 * Get current subscription
 */
export const getCurrentSubscription = async () => {
  try {
    const response = await apiClient.get('/ai/subscriptions/current/');
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch subscription.');
  }
};

/**
 * Get usage statistics
 */
export const getUsageStats = async () => {
  try {
    const response = await apiClient.get('/ai/subscriptions/usage/');
    return response.data;
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch usage statistics.');
  }
};

/**
 * Get available subscription plans
 */
export const getSubscriptionPlans = async () => {
  try {
    const response = await apiClient.get('/ai/plans/');
    return response.data;
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch subscription plans.');
  }
};

/**
 * Create or upgrade subscription
 */
export const createSubscription = async (planId) => {
  try {
    const response = await apiClient.post('/ai/subscribe/', {
      plan_id: planId
    });
    return response.data;
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw new Error(error.response?.data?.detail || 'Could not create subscription.');
  }
};

/**
 * Get AI chat usage history
 */
export const getUsageHistory = async () => {
  try {
    const response = await apiClient.get('/ai/usage/');
    return response.data;
  } catch (error) {
    console.error("Error fetching usage history:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch usage history.');
  }
};

/**
 * Cancel current subscription
 */
export const cancelSubscription = async () => {
  try {
    const response = await apiClient.post('/ai/subscriptions/cancel/');
    return response.data;
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw new Error(error.response?.data?.detail || 'Could not cancel subscription.');
  }
};
