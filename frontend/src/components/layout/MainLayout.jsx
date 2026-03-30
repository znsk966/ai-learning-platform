import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { getProfile } from '../../api/profileService';

const MainLayout = () => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    getProfile()
      .then((data) => setUsername(data.username || ''))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top header bar */}
        <header className="flex items-center justify-end px-6 lg:px-10 py-3 border-b border-gray-200 bg-white">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
              {(username?.[0] || '?').toUpperCase()}
            </div>
            {username && (
              <span className="text-sm font-medium text-gray-700">{username}</span>
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
  );
};

export default MainLayout;