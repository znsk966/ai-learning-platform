import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { getProfile } from '../../api/profileService';
import { useAuth } from '../../store/authContext';

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar — slide-over on mobile, static on md+ */}
          <div
            className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:z-auto ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 border-b border-gray-200 bg-white">
              {/* Hamburger — mobile only */}
              <button
                type="button"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    {(displayedUsername?.[0] || '?').toUpperCase()}
                  </div>
                  {displayedUsername && (
                    <span className="text-sm font-medium text-gray-700">{displayedUsername}</span>
                  )}
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg bg-white border border-gray-200 shadow-lg py-1">
                      <Link
                        to="/profile"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        View Profile
                      </Link>
                      <Link
                        to="/change-password"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        Change Password
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </header>

            <main className="flex-1 min-h-0 overflow-y-auto flex flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
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

              {/* Mobile hamburger — guest */}
              <button
                type="button"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                aria-label="Toggle navigation menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {mobileNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile nav dropdown — guest */}
            {mobileNavOpen && (
              <div className="border-t border-gray-200 px-4 py-2 md:hidden">
                <nav className="flex flex-col gap-1">
                  <Link to="/modules" className="rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600" onClick={() => setMobileNavOpen(false)}>Courses</Link>
                  <Link to="/blog" className="rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600" onClick={() => setMobileNavOpen(false)}>Blog</Link>
                  <Link to="/login" className="rounded-lg px-3 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600" onClick={() => setMobileNavOpen(false)}>Sign In</Link>
                  <Link to="/register" className="rounded-lg px-3 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50" onClick={() => setMobileNavOpen(false)}>Create Account</Link>
                </nav>
              </div>
            )}
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
