import React, { useState, useEffect } from 'react';
import { getCurrentSubscription, getSubscriptionPlans, getUsageStats, createSubscription } from '../api/subscriptionService';
import { createLemonSqueezyCheckout } from '../api/paymentService';
// import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatting';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [billingPeriod, setBillingPeriod] = useState('MONTHLY');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subData, plansData, usageData] = await Promise.all([
        getCurrentSubscription(),
        getSubscriptionPlans(),
        getUsageStats()
      ]);
      setSubscription(subData);
      setPlans(plansData.results || plansData);
      setUsageStats(usageData);
    } catch (err) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    setUpgrading(true);
    try {
      if (plan.lemon_squeezy_variant_id) {
        const checkoutData = await createLemonSqueezyCheckout(
          plan.lemon_squeezy_variant_id,
          { planId: plan.id }
        );
        if (checkoutData.checkout_url) {
          window.location.href = checkoutData.checkout_url;
          return;
        }
      }
      // Fallback: direct subscription creation (demo mode)
      await createSubscription(plan.id);
      await fetchData();
      setStatusMessage({ type: 'success', text: 'Subscription activated successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to create subscription' });
    } finally {
      setUpgrading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner text="Loading subscription information..." />;
  if (error) return <ErrorDisplay title="Error" message={error} onRetry={fetchData} />;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Subscription Management</h1>
        <p className="text-gray-600 mb-8">Manage your AI Tutor subscription and usage</p>

        {/* Current Subscription */}
        {subscription && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Subscription</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Tier</p>
                    <p className="text-xl font-semibold text-gray-800">{subscription.tier_display}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.is_valid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {subscription.is_valid ? 'Active' : 'Expired'}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="text-gray-800">{formatDate(subscription.started_at)}</span>
                  </div>
                  {subscription.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="text-gray-800">{formatDate(subscription.expires_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auto-renew:</span>
                    <span className="text-gray-800">{subscription.auto_renew ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              
              {/* Usage Stats */}
              {usageStats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Chats Used</span>
                        <span className="text-gray-800">
                          {usageStats.chats_used} / {usageStats.chats_remaining === 'unlimited' ? '∞' : usageStats.chat_limit}
                        </span>
                      </div>
                      {usageStats.chat_limit > 0 && (
                        <div className="bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={usageStats.chats_used} aria-valuemin={0} aria-valuemax={usageStats.chat_limit} aria-label="Chat usage">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((usageStats.chats_used / usageStats.chat_limit) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Tokens Used</span>
                        <span className="text-gray-800">
                          {usageStats.tokens_used?.toLocaleString() || 0} / {usageStats.tokens_remaining === 'unlimited' ? '∞' : (usageStats.token_limit?.toLocaleString() || 'N/A')}
                        </span>
                      </div>
                      {usageStats.token_limit > 0 && (
                        <div className="bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={usageStats.tokens_used} aria-valuemin={0} aria-valuemax={usageStats.token_limit} aria-label="Token usage">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((usageStats.tokens_used / usageStats.token_limit) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage.text && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Available Plans */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Available Plans</h2>

            {/* Billing toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('MONTHLY')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingPeriod === 'MONTHLY'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('YEARLY')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  billingPeriod === 'YEARLY'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yearly
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Save</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans
              .filter((plan) => {
                const period = plan.billing_period || 'MONTHLY';
                // Free tier shows in both views
                if (parseFloat(plan.price) === 0) return period === 'MONTHLY';
                return period === billingPeriod;
              })
              .map((plan) => {
              const isCurrentPlan = subscription && subscription.tier === plan.tier;
              const isUpgrade = subscription && 
                ['FREE', 'BASIC', 'PREMIUM', 'PRO'].indexOf(plan.tier) > 
                ['FREE', 'BASIC', 'PREMIUM', 'PRO'].indexOf(subscription.tier);
              
              return (
                <div
                  key={plan.id}
                  className={`border-2 rounded-lg p-6 ${
                    isCurrentPlan
                      ? 'border-blue-500 bg-blue-50'
                      : isUpgrade
                      ? 'border-green-500'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {formatPrice(parseFloat(plan.price), plan.currency)}
                    </div>
                    <p className="text-sm text-gray-600">
                      /{plan.billing_period === 'YEARLY' ? 'year' : 'month'}
                    </p>
                    {plan.billing_period === 'YEARLY' && parseFloat(plan.price) > 0 && (
                      <p className="text-xs text-green-600 font-medium mt-1">
                        {formatPrice(parseFloat(plan.price) / 12, plan.currency)}/mo
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <span className="text-green-500 mr-2" aria-hidden="true">✓</span>
                      <span className="text-gray-700">
                        {plan.monthly_chat_limit === 0 ? 'Unlimited' : plan.monthly_chat_limit} chats/month
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-green-500 mr-2" aria-hidden="true">✓</span>
                      <span className="text-gray-700">
                        {plan.monthly_token_limit === 0 ? 'Unlimited' : plan.monthly_token_limit.toLocaleString()} tokens/month
                      </span>
                    </div>
                    {plan.features && Object.keys(plan.features).length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        {Object.entries(plan.features).map(([key, value]) => (
                          <div key={key} className="flex items-center text-sm mb-1">
                            <span className="text-green-500 mr-2" aria-hidden="true">✓</span>
                            <span className="text-gray-700">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrentPlan || upgrading}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : upgrading
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : upgrading
                      ? 'Processing...'
                      : isUpgrade
                      ? 'Upgrade'
                      : 'Subscribe'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
