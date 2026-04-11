import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout Component
import MainLayout from '../components/layout/MainLayout';
import PrivateRoute from './PrivateRoute';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Pages
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import AuthPage from '../pages/AuthPage';
import EmailVerificationPage from '../pages/EmailVerificationPage';
import PasswordResetRequestPage, { PasswordResetConfirmPage } from '../pages/PasswordResetPage';
import PasswordChangePage from '../pages/PasswordChangePage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import RefundPage from '../pages/RefundPage';
import ModulesPage from '../pages/ModulesPage';
import ModuleDetailPage from '../pages/ModuleDetailPage';
import SubmoduleDetailPage from '../pages/SubmoduleDetailPage';
import LessonDetailPage from '../pages/LessonDetailPage';
import DashboardPage from '../pages/DashboardPage';
import SubscriptionPage from '../pages/SubscriptionPage';
import ProfilePage from '../pages/ProfilePage';
import BlogListPage from '../pages/BlogListPage';
import BlogDetailPage from '../pages/BlogDetailPage';


const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Routes WITHOUT the sidebar layout */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<ErrorBoundary><AuthPage /></ErrorBoundary>} />
        <Route path="/register" element={<ErrorBoundary><AuthPage /></ErrorBoundary>} />
        <Route path="/verify-email/:token" element={<ErrorBoundary><EmailVerificationPage /></ErrorBoundary>} />
        <Route path="/forgot-password" element={<ErrorBoundary><PasswordResetRequestPage /></ErrorBoundary>} />
        <Route path="/reset-password/:token" element={<ErrorBoundary><PasswordResetConfirmPage /></ErrorBoundary>} />
        <Route path="/change-password" element={<ErrorBoundary><PasswordChangePage /></ErrorBoundary>} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund" element={<RefundPage />} />

        {/* Routes WITH the sidebar layout — authentication required */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
          <Route path="/subscription" element={<ErrorBoundary><SubscriptionPage /></ErrorBoundary>} />
          <Route path="/modules" element={<ErrorBoundary><ModulesPage /></ErrorBoundary>} />
          <Route path="/modules/:moduleId" element={<ErrorBoundary><ModuleDetailPage /></ErrorBoundary>} />
          <Route path="/submodule/:submoduleId" element={<ErrorBoundary><SubmoduleDetailPage /></ErrorBoundary>} />
          <Route path="/modules/:moduleId/lesson/:lessonId" element={<ErrorBoundary><LessonDetailPage /></ErrorBoundary>} />
          <Route path="/submodule/:submoduleId/lesson/:lessonId" element={<ErrorBoundary><LessonDetailPage /></ErrorBoundary>} />
          <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
          <Route path="/blog" element={<ErrorBoundary><BlogListPage /></ErrorBoundary>} />
          <Route path="/blog/:slug" element={<ErrorBoundary><BlogDetailPage /></ErrorBoundary>} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;