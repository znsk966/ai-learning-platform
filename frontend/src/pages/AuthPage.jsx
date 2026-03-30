import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as loginService, register as registerService } from '../api/authService';
import { useAuth } from '../store/authContext';
import { UserIcon, MailIcon, AuthLockIcon as LockIcon, EyeIcon } from '../components/common/Icons';

// --- Animated SVG Component ---
const AuthIllustration = () => (
    <div className="hidden lg:flex items-center justify-center flex-1 bg-gray-100 p-10">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#0C80F8" d="M47.3,-62.4C60.3,-52.5,69.1,-37,73.4,-20.5C77.7,-4,77.5,13.6,70,27.1C62.5,40.6,47.7,49.9,32.7,59.1C17.7,68.2,2.5,77.1,-12.7,77.7C-27.9,78.2,-43.1,70.5,-55.8,58.8C-68.5,47.1,-78.7,31.4,-81.4,14.7C-84.1,-2,-79.3,-19.7,-69.6,-32.8C-59.8,-45.9,-45,-54.3,-30.5,-62.5C-16,-70.7,-1.8,-78.7,11.8,-79.9C25.4,-81.1,50.8,-75.4,47.3,-62.4Z" transform="translate(100 100) scale(1.1)">
                <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite"></animateTransform>
            </path>
             <path fill="#85C6F2" d="M42.7,-69.4C56.2,-61.9,68.7,-50.2,74,-36.5C79.3,-22.8,77.3,-7.1,73.9,7.6C70.5,22.3,65.7,36,56.9,46.5C48.1,57,35.3,64.3,21.9,70.3C8.5,76.3,-5.6,81,-19.9,78.8C-34.2,76.5,-48.7,67.3,-59.8,55.1C-70.9,42.9,-78.6,27.7,-81.2,11.5C-83.8,-4.6,-81.3,-21.7,-72.7,-35.8C-64.1,-50,-49.4,-61.2,-34.5,-68.8C-19.6,-76.3,-4.5,-80.2,9.8,-80.6C24.1,-81,42.7,-69.4,42.7,-69.4Z" transform="translate(100 100) scale(0.9)">
                 <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="15s" repeatCount="indefinite"></animateTransform>
             </path>
        </svg>
    </div>
);


const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const isLoginView = location.pathname === '/login';
  const successMessage = useMemo(() => location.state?.message || '', [location.state]);
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLoginView) {
      try {
        const data = await loginService(username, password);
        login(data.access, data.refresh);
        navigate('/modules');
      } catch (err) {
        setError(err.message || "Failed to login. Please check your credentials.");
      }
    } else {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        setLoading(false);
        return;
      }
      if (password !== passwordConfirm) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      try {
        await registerService({ username, email, password, password_confirm: passwordConfirm });
        navigate('/login', { state: { message: "Registration successful! Please check your email to verify your account." } });
      } catch (err) {
        setError(err.message || "Failed to register. This username may already be taken.");
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
      <AuthIllustration />

      {/* Right side: Form */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8">
          <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800">{isLoginView ? 'Welcome Back!' : 'Create Your Account'}</h1>
                  <p className="text-gray-500 mt-2">{isLoginView ? 'Sign in to continue to your dashboard.' : 'Get started with your new learning journey.'}</p>
              </div>

              <div className="bg-white p-8 rounded-xl lg:shadow-none shadow-lg">
                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon /></span>
                          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                      </div>

                      {!isLoginView && (
                          <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><MailIcon /></span>
                              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                          </div>
                      )}
                      
                      <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                          <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-10 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                              <EyeIcon show={showPassword} />
                          </button>
                      </div>

                      {!isLoginView && (
                          <div className="relative">
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LockIcon /></span>
                              <input type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required className="w-full pl-10 pr-10 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                          </div>
                      )}
                      
                      {error && <p className="text-sm text-center text-red-500 font-medium">{error}</p>}
                      {successMessage && <p className="text-sm text-center text-green-500 font-medium">{successMessage}</p>}
                      
                      <button type="submit" disabled={loading} className="w-full py-3 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:bg-blue-400">
                          {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
                      </button>
                  </form>

                  <p className="text-sm text-center text-gray-500 mt-6">
                      {isLoginView ? "Don't have an account?" : "Already have an account?"}
                      <button onClick={toggleView} className="ml-1 font-semibold text-blue-600 hover:underline">
                          {isLoginView ? 'Sign Up' : 'Sign In'}
                      </button>
                  </p>
                  
                  {isLoginView && (
                      <p className="text-sm text-center text-gray-500 mt-2">
                          <a href="/forgot-password" className="font-semibold text-blue-600 hover:underline">
                              Forgot Password?
                          </a>
                      </p>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default AuthPage;
// This code defines the AuthPage component which handles both login and registration.
// It uses React hooks for state management and side effects, and integrates with a mock authentication service