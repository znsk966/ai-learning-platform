import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const TermsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">&larr; Back to Home</Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 28, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using Simple &amp; Plain AI ("Service"), a Nedex Education product, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              Simple &amp; Plain AI provides online educational courses with AI-powered tutoring, interactive lessons, quizzes, and progress tracking. Access to certain features requires a paid subscription.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Accounts</h2>
            <p className="text-gray-600 leading-relaxed">
              You must register for an account to access the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration and keep your account information updated.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Subscriptions and Payments</h2>
            <p className="text-gray-600 leading-relaxed">
              Some features of the Service require a paid subscription. Subscription fees are billed on a recurring basis according to the plan you select. You authorize us to charge your chosen payment method for the subscription fees. Prices are subject to change with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Acceptable Use</h2>
            <p className="text-gray-600 leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Share your account credentials with others</li>
              <li>Reproduce, distribute, or resell course content without permission</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Use the AI tutor to generate harmful, misleading, or inappropriate content</li>
              <li>Interfere with the proper functioning of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              All course content, materials, and platform design are the property of Simple &amp; Plain AI, Nedex Education, or their content creators. You are granted a limited, non-exclusive, non-transferable license to access and use the content for personal educational purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. AI Tutor Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed">
              The AI tutor provides automated assistance for educational purposes. While we strive for accuracy, AI-generated responses may contain errors. The AI tutor is not a substitute for professional instruction and should be used as a supplementary learning tool.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Simple &amp; Plain AI and Nedex Education shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms. You may cancel your account at any time. Upon termination, your access to paid content will end at the conclusion of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these Terms from time to time. We will notify you of significant changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about these Terms, please contact us through the platform.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
