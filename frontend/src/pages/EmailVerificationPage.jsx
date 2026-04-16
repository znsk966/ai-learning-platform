import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyEmail, resendVerificationEmail } from '../api/authService';
import { MailIcon } from '../components/common/Icons';

const EmailVerificationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state || {};
  const initialStatus = token ? 'verifying' : (routeState.status || 'sent');
  const [status, setStatus] = useState(initialStatus); // verifying, success, error, sent
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(routeState.email || '');
  const [resending, setResending] = useState(false);

  const verifyEmailToken = useCallback(async () => {
    try {
      const response = await verifyEmail(token);
      setStatus('success');
      setMessage(response.message || 'Your email has been verified successfully.');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Email verified. You can now sign in.' } });
      }, 2500);
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'We could not verify your email address.');
    }
  }, [navigate, token]);

  useEffect(() => {
    if (token) {
      verifyEmailToken();
    } else if (routeState.message) {
      setMessage(routeState.message);
      setStatus(routeState.status || 'sent');
    }
  }, [routeState.message, routeState.status, token, verifyEmailToken]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    setResending(true);
    try {
      await resendVerificationEmail(email);
      setStatus('sent');
      setMessage('Verification email sent. Check your inbox and spam folder for the link.');
    } catch (error) {
      setMessage(error.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-blue-100/20 p-8 border border-gray-100">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying your email</h2>
            <p className="text-gray-600">Please wait while we confirm your verification link.</p>
          </div>
        )}

        {status === 'sent' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <MailIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your inbox</h2>
            <p className="text-gray-600 mb-3">{message || 'We sent a verification link to your email address.'}</p>
            {email && <p className="text-sm font-medium text-gray-700 mb-6">{email}</p>}

            <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-left">
              <p className="text-sm text-gray-700 mb-3">Need another verification email?</p>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </form>
            </div>

            <Link
              to="/login"
              className="inline-block mt-6 text-blue-600 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Email verified</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
              <p className="text-sm text-gray-700 mb-3">Request a new verification email:</p>
              <form onSubmit={handleResend} className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              </form>
            </div>

            <Link
              to="/login"
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationPage;

