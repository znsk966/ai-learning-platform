import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProgressAnalytics } from '../api/contentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const DashboardPage = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgressData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProgressAnalytics();
        setProgressData(data);
      } catch (err) {
        setError(err.message || 'Could not load your progress data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgressData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <ErrorDisplay title="Error Loading Dashboard" message={error} onRetry={() => { setError(''); setLoading(true); getProgressAnalytics().then(setProgressData).catch(err => setError(err.message || 'Could not load your progress data.')).finally(() => setLoading(false)); }} />;

  if (!progressData) {
    return (
      <div className="text-center text-gray-500 py-16">
        <p>No progress data available.</p>
      </div>
    );
  }

  const { overall_progress, study_streak, stats, next_lesson, enrolled_courses, recent_activity } = progressData;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back — here's your learning overview</p>
      </div>

      {/* Continue Learning CTA */}
      {next_lesson && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-400 mb-1">Continue where you left off</p>
            <h2 className="text-lg font-semibold text-white">{next_lesson.title}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {next_lesson.module_title} &middot; {next_lesson.submodule_title}
            </p>
          </div>
          <Link
            to={next_lesson.url}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Resume Lesson
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Progress"
          value={`${overall_progress.percentage}%`}
          sub={`${overall_progress.completed_lessons} / ${overall_progress.total_lessons} lessons`}
        />
        <StatCard
          label="Study Streak"
          value={study_streak}
          sub="days"
        />
        <StatCard
          label="Enrolled"
          value={stats.enrolled_modules || 0}
          sub="courses"
        />
        <StatCard
          label="Journey"
          value={stats.days_since_start}
          sub="days learning"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">My Courses</h3>
            <Link to="/modules" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
          {(!enrolled_courses || enrolled_courses.length === 0) ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">No courses yet</p>
              <Link to="/modules" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Browse courses</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolled_courses.slice(0, 4).map((course) => (
                <Link
                  key={course.id}
                  to={`/modules/${course.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {course.progress.completed_lessons} / {course.progress.total_lessons} lessons
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${course.progress.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${course.progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-8 text-right">{course.progress.percentage}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {(!recent_activity || recent_activity.length === 0) ? (
            <p className="text-sm text-gray-500 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recent_activity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.lesson_title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activity.module_title} &middot; {activity.days_ago === 0 ? 'Today' : `${activity.days_ago}d ago`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <QuickLink
          to="/modules"
          title="Browse Modules"
          description="Explore available courses"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />}
        />
        <QuickLink
          to="/subscription"
          title="Subscription"
          description="Manage your plan & usage"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />}
        />
        <QuickLink
          to="/profile"
          title="Profile"
          description="Account settings"
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />}
        />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
  </div>
);

const QuickLink = ({ to, title, description, icon }) => (
  <Link
    to={to}
    className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
  >
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600 shrink-0">
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icon}
      </svg>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </Link>
);

export default DashboardPage;