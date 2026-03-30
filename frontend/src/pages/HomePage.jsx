//src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 md:text-6xl">
            Welcome to AI in Plain English
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start your journey with our interactive modules and lessons.
          </p>
          <div className="mt-8 space-x-4">
            <Link
              to="/login"
              className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg shadow-md hover:bg-gray-100"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;