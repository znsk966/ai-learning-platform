import apiClient from './api';

/**
 * Creates a payment intent for a course purchase
 */
export const createPaymentIntent = async (moduleId) => {
  try {
    const response = await apiClient.post('/payments/create-intent/', {
      module_id: moduleId
    });
    return response.data;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(error.response?.data?.detail || 'Could not create payment intent.');
  }
};

/**
 * Confirms a payment and enrolls the user
 */
export const confirmPayment = async (paymentIntentId, transactionId = null) => {
  try {
    const response = await apiClient.post('/payments/confirm/', {
      payment_intent_id: paymentIntentId,
      transaction_id: transactionId
    });
    return response.data;
  } catch (error) {
    console.error("Error confirming payment:", error);
    throw new Error(error.response?.data?.detail || 'Could not confirm payment.');
  }
};

/**
 * Enrolls user in a free course
 */
export const enrollFreeCourse = async (moduleId) => {
  try {
    const response = await apiClient.post('/payments/enroll-free/', {
      module_id: moduleId
    });
    return response.data;
  } catch (error) {
    console.error("Error enrolling in free course:", error);
    throw new Error(error.response?.data?.detail || 'Could not enroll in course.');
  }
};

/**
 * Creates a Lemon Squeezy checkout session.
 * @param {string} variantId - Lemon Squeezy product variant ID.
 * @param {object} options - Either { moduleId } for course or { planId } for subscription.
 * @returns {{ checkout_url, checkout_id, transaction_id, amount, currency }}
 */
export const createLemonSqueezyCheckout = async (variantId, { moduleId, planId } = {}) => {
  try {
    const payload = { variant_id: variantId };
    if (moduleId) payload.module_id = moduleId;
    if (planId) payload.plan_id = planId;

    const response = await apiClient.post('/payments/lemonsqueezy/checkout/', payload);
    return response.data;
  } catch (error) {
    console.error("Error creating Lemon Squeezy checkout:", error);
    throw new Error(error.response?.data?.detail || 'Could not create checkout.');
  }
};

/**
 * Fetches user's payment transactions
 */
export const getPaymentTransactions = async () => {
  try {
    const response = await apiClient.get('/payments/transactions/');
    return response.data;
  } catch (error) {
    console.error("Error fetching payment transactions:", error);
    throw new Error(error.response?.data?.detail || 'Could not fetch payment transactions.');
  }
};
