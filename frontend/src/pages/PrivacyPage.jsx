import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm mb-6 inline-block">&larr; Back to Home</Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 28, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed">We collect the following types of information:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li><strong>Account information:</strong> Username, email address, and encrypted password when you register</li>
              <li><strong>Learning data:</strong> Course progress, quiz results, lesson completions, and study activity</li>
              <li><strong>AI interactions:</strong> Questions you ask the AI tutor and the responses generated</li>
              <li><strong>Payment information:</strong> Processed securely through third-party providers (Lemon Squeezy); we do not store your payment card details</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and time spent on the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Provide and maintain the Service, including personalized learning experiences</li>
              <li>Process subscriptions and payments</li>
              <li>Track your learning progress and provide analytics</li>
              <li>Power the AI tutor with relevant lesson context for your questions</li>
              <li>Send important account notifications (email verification, password resets)</li>
              <li>Improve our courses, platform features, and AI responses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. AI Tutor Data</h2>
            <p className="text-gray-600 leading-relaxed">
              When you use the AI tutor, your questions are sent to our backend server along with relevant lesson context. We use Google Gemini to generate responses. Your questions and the AI responses are logged for usage metering and service improvement. We do not share your individual AI interactions with third parties beyond the AI service provider necessary to generate responses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li><strong>Payment processors:</strong> Lemon Squeezy for subscription billing</li>
              <li><strong>AI service providers:</strong> Google (Gemini API) for AI tutor functionality</li>
              <li><strong>Infrastructure providers:</strong> Hosting and CDN services necessary to deliver the platform</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement industry-standard security measures including encrypted passwords, HTTPS encryption, JWT-based authentication with token rotation, rate limiting, and secure cookie settings. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your account and learning data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., payment records).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your learning progress data</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use localStorage to store authentication tokens for session management. We do not use third-party tracking cookies. Essential cookies may be used for security and functionality purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              The Service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us through the platform.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
