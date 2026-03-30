import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const RefundPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">&larr; Back to Home</Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 28, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Subscription Refunds</h2>
            <p className="text-gray-600 leading-relaxed">
              We want you to be satisfied with our Service. If you are not happy with your subscription, the following refund terms apply:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li><strong>7-day money-back guarantee:</strong> You may request a full refund within 7 days of your initial subscription purchase</li>
              <li><strong>Renewal refunds:</strong> Refund requests for renewal charges must be made within 48 hours of the renewal date</li>
              <li><strong>Partial refunds:</strong> After the 7-day period, refunds are not available for the current billing cycle</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How to Request a Refund</h2>
            <p className="text-gray-600 leading-relaxed">To request a refund:</p>
            <ol className="list-decimal list-inside text-gray-600 mt-2 space-y-1">
              <li>Contact us through the platform with your account details</li>
              <li>Include your reason for the refund request</li>
              <li>Provide the transaction or subscription ID if available</li>
            </ol>
            <p className="text-gray-600 leading-relaxed mt-3">
              We aim to process all refund requests within 5-10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Refund Processing</h2>
            <p className="text-gray-600 leading-relaxed">
              Approved refunds will be returned to your original payment method. Processing times depend on your payment provider and may take 5-10 business days to appear on your statement. Refunds are processed through Lemon Squeezy, our payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Free Courses</h2>
            <p className="text-gray-600 leading-relaxed">
              Free courses and the free subscription tier do not involve any payment and are therefore not subject to refunds. You may unenroll from free courses at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Subscription Cancellation</h2>
            <p className="text-gray-600 leading-relaxed">
              You may cancel your subscription at any time. Upon cancellation:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>You will retain access to paid features until the end of your current billing period</li>
              <li>Your account will revert to the free tier after the billing period ends</li>
              <li>Your learning progress and course history will be preserved</li>
              <li>No further charges will be made after cancellation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Exceptions</h2>
            <p className="text-gray-600 leading-relaxed">Refunds may not be available in the following cases:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Accounts terminated for violation of our Terms of Service</li>
              <li>Requests made outside the eligible refund window</li>
              <li>Repeated refund requests indicating abuse of the refund policy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify this Refund Policy at any time. Changes will be posted on this page with an updated date. The policy in effect at the time of your purchase will apply to that transaction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about refunds or need assistance, please contact us through the platform.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RefundPage;
