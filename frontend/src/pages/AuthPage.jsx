import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login as loginService, register as registerService } from '../api/authService';
import { useAuth } from '../store/authContext';
import { UserIcon, MailIcon, AuthLockIcon as LockIcon, EyeIcon } from '../components/common/Icons';

const AuthIllustration = ({ isLoginView }) => (
  <div className="hidden lg:flex items-center justify-center flex-1 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_35%),linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-10">
    <div className="max-w-lg">
      <div className="mb-8 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Nedex Education</div>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-gray-900">
          {isLoginView ? 'Return to your learning path.' : 'Create your account and unlock the full platform.'}
        </h2>
        <p className="mt-4 text-base leading-7 text-gray-600">
          Simple &amp; Plain AI keeps the first step clear: browse as a guest, then create an account when you want to open lessons and track progress.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Simple &amp; Plain AI</div>
          <p className="mt-2 text-sm leading-6 text-gray-600">A straightforward AI learning experience for people who want clarity before complexity.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-gray-900">Courses</div>
            <p className="mt-2 text-sm text-gray-600">Structured modules with chapters and lessons.</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-gray-900">Labs</div>
            <p className="mt-2 text-sm text-gray-600">Practice through simulations and problem solving.</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="text-sm font-semibold text-gray-900">AI Tutor</div>
            <p className="mt-2 text-sm text-gray-600">Get guided help inside supported lessons.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);


const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const isLoginView = location.pathname === '/login';
  const stateMessage = useMemo(() => location.state?.message || '', [location.state]);
  const stateMessageType = location.state?.messageType || 'success';
  const targetPath = location.state?.from?.pathname || '/modules';
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!username.trim()) {
      return 'Enter your username.';
    }

    if (!isLoginView) {
      if (!email.trim()) {
        return 'Enter your email address.';
      }

      if (!isValidEmail(email)) {
        return 'Enter a valid email address.';
      }
    }

    if (!password) {
      return 'Enter your password.';
    }

    if (!isLoginView) {
      if (password.length < 8) {
        return 'Password must be at least 8 characters long.';
      }

      if (!passwordConfirm) {
        return 'Confirm your password.';
      }

      if (password !== passwordConfirm) {
        return 'Passwords do not match.';
      }
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    if (isLoginView) {
      try {
        const data = await loginService(username, password);
        login(data.access, data.refresh);
        navigate(targetPath, { replace: true });
      } catch (err) {
        setError(err.message || 'Unable to sign in. Check your username and password and try again.');
      }
    } else {
      try {
        await registerService({ username, email, password, password_confirm: passwordConfirm });
        navigate('/verify-email', {
          state: {
            status: 'sent',
            email,
            message: 'Your account has been created. Check your inbox to verify your email address before signing in.',
          },
        });
      } catch (err) {
        setError(err.message || 'Unable to create your account. Review the details and try again.');
      }
    }
    setLoading(false);
  };

  const toggleView = () => {
    navigate(isLoginView ? '/register' : '/login');
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side: Animated SVG (hidden on small screens) */}
      <AuthIllustration isLoginView={isLoginView} />

      {/* Right side: Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 bg-white">
          <div className="w-full max-w-md mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="text-sm font-medium text-gray-500 transition-colors hover:text-blue-600">
            ← Back to home
            </Link>
            <Link to={isLoginView ? '/modules' : '/blog'} className="text-sm font-medium text-gray-500 transition-colors hover:text-blue-600">
            {isLoginView ? 'Browse course titles' : 'Browse blog titles'}
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{isLoginView ? 'Sign in to continue learning' : 'Create your account'}</h1>
            <p className="mt-2 text-gray-500">{isLoginView ? 'Open your courses, lessons, and saved progress.' : 'Unlock course chapters, lessons, and full blog content.'}</p>
              </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-blue-100/20">
                  {stateMessage && (
                    <p className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${
                      stateMessageType === 'info'
                        ? 'border border-blue-200 bg-blue-50 text-blue-700'
                        : 'border border-green-200 bg-green-50 text-green-700'
                    }`}>
                      {stateMessage}
                    </p>
                  )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
                      <div className="relative">
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">Username</label>
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon /></span>
                <input id="username" type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" autoComplete={isLoginView ? 'username' : 'nickname'} />
                      </div>

                      {!isLoginView && (
                          <div className="relative">
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><MailIcon /></span>
                  <input id="email" type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" autoComplete="email" />
                          </div>
                      )}
                      
                      <div className="relative">
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder={isLoginView ? 'Enter your password' : 'Create a password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 border rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" autoComplete={isLoginView ? 'current-password' : 'new-password'} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                              <EyeIcon show={showPassword} />
                          </button>
                      </div>

                      {!isLoginView && (
                          <div className="relative">
                  <label htmlFor="passwordConfirm" className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                  <input id="passwordConfirm" type={showPassword ? 'text' : 'password'} placeholder="Repeat your password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="w-full pl-10 pr-10 py-3 border rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" autoComplete="new-password" />
                  <p className="mt-2 text-xs text-gray-500">Use at least 8 characters.</p>
                          </div>
                      )}
                      
              {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-center text-red-600 font-medium">{error}</p>}
                      
              <button type="submit" disabled={loading} className="w-full py-3 text-white font-semibold bg-blue-600 rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:bg-blue-400">
                {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
                      </button>
                  </form>

                  <p className="text-sm text-center text-gray-500 mt-6">
              {isLoginView ? 'Need an account?' : 'Already have an account?'}
                      <button onClick={toggleView} className="ml-1 font-semibold text-blue-600 hover:underline">
                {isLoginView ? 'Create one' : 'Sign in'}
                      </button>
                  </p>
                  
                  {isLoginView && (
                      <p className="text-sm text-center text-gray-500 mt-2">
                <Link to="/forgot-password" className="font-semibold text-blue-600 hover:underline">
                  Forgot your password?
                </Link>
                      </p>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default AuthPage;