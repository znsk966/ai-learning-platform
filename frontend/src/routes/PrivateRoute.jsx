import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';

const getAuthMessage = (pathname) => {
  if (pathname.startsWith('/modules/') || pathname.startsWith('/submodule/')) {
    return 'You must create an account first to view course chapters and lessons.';
  }

  if (pathname.startsWith('/blog/')) {
    return 'You must create an account first to read the full blog post.';
  }

  return 'Sign in or create an account to continue.';
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: getAuthMessage(location.pathname),
          messageType: 'info',
        }}
        replace
      />
    );
  }

  return children;
};

export default PrivateRoute;
