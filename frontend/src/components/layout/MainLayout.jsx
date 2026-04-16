import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { getProfile } from '../../api/profileService';
import { useAuth } from '../../store/authContext';

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    getProfile()
      .then((data) => setUsername(data.username || ''))
      .catch(() => {});
  }, [isAuthenticated]);

  const displayedUsername = isAuthenticated ? username : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-y-auto">
            <header className="flex items-center justify-end px-6 lg:px-10 py-3 border-b border-gray-200 bg-white">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
                  {(displayedUsername?.[0] || '?').toUpperCase()}
                </div>
                {displayedUsername && (
                  <span className="text-sm font-medium text-gray-700">{displayedUsername}</span>
                )}
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </Link>
            </header>

            <main className="flex-1 px-6 py-8 lg:px-10">
              <Outlet />
            </main>
            <Footer />
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link to="/" className="flex items-center gap-3 text-gray-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                  AI
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Nedex Education</div>
                  <div className="text-lg font-semibold">Simple &amp; Plain AI</div>
                </div>
              </Link>

              <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
                <Link to="/modules" className="transition-colors hover:text-blue-600">Courses</Link>
                <Link to="/blog" className="transition-colors hover:text-blue-600">Blog</Link>
                <Link to="/login" className="transition-colors hover:text-blue-600">Sign In</Link>
                <Link to="/register" className="rounded-full bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">Create Account</Link>
              </nav>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      )}
    </div>
  );
};

export default MainLayout;