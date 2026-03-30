import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmail, resendVerificationEmail } from '../api/authService';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmailToken();
    }
  }, [token]);

  const verifyEmailToken = async () => {
    try {
      const response = await verifyEmail(token);
      setStatus('success');
      setMessage(response.message || 'Email verified successfully!');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Email verified! You can now log in.' } });
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Email verification failed.');
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    setResending(true);
    try {
      await resendVerificationEmail(email);
      setStatus('success');
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setMessage(error.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">Didn't receive the email? Resend it:</p>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </form>
            </div>

            <Link
              to="/login"
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;

