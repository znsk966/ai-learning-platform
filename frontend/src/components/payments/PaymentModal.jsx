import React, { useState } from 'react';
import { createPaymentIntent, confirmPayment, createLemonSqueezyCheckout } from '../../api/paymentService';
import { formatPrice } from '../../utils/formatting';

const PaymentModal = ({ module, onClose, onSuccess }) => {
  const [step, setStep] = useState('payment'); // 'payment' or 'processing'
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isSandbox, setIsSandbox] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');
    setStep('processing');

    try {
      if (paymentMethod === 'lemonsqueezy') {
        const checkoutData = await createLemonSqueezyCheckout(
          module.lemon_squeezy_variant_id || 'default',
          { moduleId: module.id }
        );
        if (checkoutData.sandbox) {
          setIsSandbox(true);
        }
        if (checkoutData.checkout_url) {
          window.location.href = checkoutData.checkout_url;
          return;
        }
        // Demo mode fallback — no real checkout URL returned
        onSuccess();
      } else {
        // Stripe/PayPal demo flow
        const paymentData = await createPaymentIntent(module.id);
        await confirmPayment(
          paymentData.payment_intent_id || paymentData.transaction_id,
          paymentData.transaction_id
        );
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
      setStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Purchase Course</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'payment' ? (
            <>
              {/* Course Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(parseFloat(module.price), module.currency)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 2.506.956 4.297 2.862 5.676 2.139 1.519 5.347 2.423 5.347 4.304 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C2.945 21.93 5.558 23 9.16 23c2.716 0 4.844-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-2.157-.893-3.794-2.748-5.305z"/>
                      </svg>
                      <span className="font-medium">Stripe</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.174 1.351 1.05 3.3.93 4.855-.024.35-.048.7-.072 1.03-.02.28-.04.54-.04.78 0 .66.035 1.001.705 1.38 1.04.58 1.64 1.45 1.64 2.75 0 1.89-1.52 3.26-4.28 3.26h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.203zm1.461-13.986c.174-1.097.537-2.713 1.23-4.83H5.998c-.31 0-.582.21-.633.516l-1.83 11.838h4.92c.435 0 .805.317.877.739l.704 4.528 2.05-13.22a.64.64 0 0 1 .633-.516h4.83c.31 0 .582.21.633.516l1.228 7.912c.07.455-.26.88-.714.88h-3.576a.64.64 0 0 1-.633-.516l-.822-5.293a.64.64 0 0 0-.633-.516H8.537zm9.28 9.9c.174-1.097.537-2.713 1.23-4.83h-3.69c-.31 0-.582.21-.633.516l-1.83 11.838h4.92c.435 0 .805.317.877.739l.704 4.528 2.05-13.22a.64.64 0 0 1 .633-.516h4.83c.31 0 .582.21.633.516l1.228 7.912c.07.455-.26.88-.714.88h-3.576a.64.64 0 0 1-.633-.516l-.822-5.293a.64.64 0 0 0-.633-.516h-2.19c-.31 0-.582.21-.633.516z"/>
                      </svg>
                      <span className="font-medium">PayPal</span>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="lemonsqueezy"
                      checked={paymentMethod === 'lemonsqueezy'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="#FFC233">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                      </svg>
                      <span className="font-medium">Lemon Squeezy</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sandbox Banner */}
              {isSandbox && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    SANDBOX MODE — No real charges will be made. Use test card 4242 4242 4242 4242.
                  </p>
                </div>
              )}

              {/* Info Message */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Payment gateway integration is in development.
                  This is a demo flow. In production, you'll be redirected to your chosen payment provider for secure payment processing.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  Pay {formatPrice(parseFloat(module.price), module.currency)}
                </button>
              </div>
            </>
          ) : (
            /* Processing State */
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">Processing payment...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait while we confirm your payment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
