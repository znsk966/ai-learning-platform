//src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef4ff_48%,#ffffff_100%)]">
      <div className="border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 text-gray-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-sm">
              AI
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Nedex Education</div>
              <div className="text-lg font-semibold">Simple &amp; Plain AI</div>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Link to="/modules" className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600">
              Browse Courses
            </Link>
            <Link to="/blog" className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600">
              Read the Blog
            </Link>
            <Link to="/login" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:text-blue-600">
              Sign In
            </Link>
            <Link to="/register" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid w-full gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-100 bg-white/80 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm">
              AI learning, made simpler and clearer
            </div>
            <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-tight text-gray-900 md:text-6xl">
              One clear learning path for modern AI skills.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Explore course and blog titles as a guest, then create an account when you are ready to open chapters, lessons, and full learning content.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Start Learning
              </Link>
              <Link
                to="/modules"
                className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600"
              >
                Browse Course Titles
              </Link>
              <Link
                to="/blog"
                className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600"
              >
                Browse Blog Titles
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Structured</div>
                <p className="mt-2 text-sm leading-6 text-gray-600">Follow a consistent sequence of modules, chapters, and lessons without guessing what comes next.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Interactive</div>
                <p className="mt-2 text-sm leading-6 text-gray-600">Move between reading, labs, quizzes, and guided practice instead of passive content only.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Supported</div>
                <p className="mt-2 text-sm leading-6 text-gray-600">Use the AI tutor when you need help understanding a lesson or getting unstuck.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-blue-200/60 blur-3xl" />
            <div className="absolute -right-10 bottom-4 h-36 w-36 rounded-full bg-cyan-200/60 blur-3xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Preview Experience</div>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">Guest-friendly catalog, account-first learning.</h2>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Simple &amp; Plain AI</div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Browse titles as a guest</div>
                      <p className="mt-1 text-sm text-gray-600">See available courses and published blog posts before you create an account.</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">Step 1</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Create an account to continue</div>
                      <p className="mt-1 text-sm text-gray-600">Unlock chapters, lessons, and full post content with a clear sign-up and verification flow.</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">Step 2</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="text-sm font-semibold text-blue-900">Designed for consistency</div>
                  <p className="mt-1 text-sm text-blue-800">No mixed-language hero text, no ambiguous access states, and no unclear next step after registration.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;