# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered learning platform with a Django REST Framework backend and React + Vite frontend. Users enroll in courses (Module -> SubModule -> Lesson hierarchy), complete six lesson types, and interact with an AI tutor powered by Google Gemini. Subscriptions (FREE/BASIC/PREMIUM/PRO) control AI tutor usage limits.

## Development Commands

### Backend

```bash
# Activate virtual environment (from project root)
source venv/Scripts/activate   # Windows Git Bash
# or: venv\Scripts\activate    # Windows CMD

# Install dependencies
pip install -r requirements.txt

# Run dev server (requires SECRET_KEY and DEBUG=True in .env)
python manage.py runserver

# Database migrations
python manage.py makemigrations
python manage.py migrate

# Seed subscription plans (required after first migration)
python manage.py setup_subscription_plans

# Create superuser
python manage.py createsuperuser

# Run tests (uses backend/test_settings.py — SQLite in-memory, throttling disabled)
python manage.py test
python manage.py test users              # single app
python manage.py test content.tests.LessonLockingTest  # single test class

# Lint (ruff config in pyproject.toml — Python 3.12, line-length 120, E501 ignored)
ruff check .
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # starts Vite dev server at http://localhost:5173
npm run build
npm run lint
npm run preview
```

### Docker

```bash
docker-compose up          # starts postgres, backend, frontend
docker-compose up -d db    # just the database
```

## Environment Setup

**Required**: `.env` in the project root. `SECRET_KEY` is mandatory (no default — app raises `ImproperlyConfigured`).

```
SECRET_KEY=your-secret-key          # REQUIRED - no fallback
DEBUG=True                          # defaults to False if missing
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=ai_learning_db
DB_USER=ai_learning_user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DEMO_MODE=True                      # allows subscription creation without real payment
```

Frontend env (`frontend/.env`):
```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Architecture

### Backend Apps

| App | Responsibility |
|-----|---------------|
| `users` | Registration, JWT auth, email verification, password reset |
| `content` | Modules, SubModules, Lessons, enrollment, progress tracking, analytics |
| `ai_tutor` | Gemini API proxy, subscriptions, usage metering, plan management |
| `assessment` | Quizzes, questions, answer choices, attempt scoring |
| `payments` | Payment transactions, Lemon Squeezy checkout/webhooks, free enrollment |
| `blog` | Posts (slug-based lookup), categories, tags, premium content gating |
| `progress` | Minimal — reserved for future progress expansion |
| `backend` | Django project config, root URL routing, custom permissions, throttles, email backend |

### External Services

| Service | Purpose | Config |
|---------|---------|--------|
| Google Gemini | AI tutor responses | `GEMINI_API_KEY` — tries models: gemini-2.5-flash, gemini-2.0-flash, gemini-flash-latest |
| Lemon Squeezy | Course + subscription payments | `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, webhook with HMAC-SHA256 |
| Bunny.net | Video streaming + file hosting | `BUNNY_STREAM_*` for video, `BUNNY_STORAGE_*` for lab files |
| Resend | Production email delivery | `RESEND_API_KEY` — custom backend in `backend/email_backend.py` |

### API URL Structure

```
/api/users/         -> auth endpoints (register, verify-email, password-reset, etc.)
/api/content/       -> modules, submodules, lessons, dashboard, analytics
/api/ai/            -> AI tutor (/ask/), subscriptions, plans, usage
/api/assessment/    -> quizzes, attempts
/api/payments/      -> transactions, create-intent, confirm, enroll-free, lemon-squeezy checkout/webhook
/api/blog/          -> posts, categories, tags
/api/token/         -> JWT obtain (POST username+password)
/api/token/refresh/ -> JWT refresh
/api/docs/          -> Swagger UI (drf-spectacular)
/api/schema/        -> OpenAPI schema
/admin/             -> Django admin
```

### Authentication Flow

- Registration creates an **inactive** user + sends verification email
- Email verification activates the account
- JWT tokens: access (1 hour) + refresh (7 days) with rotation and blacklisting
- Frontend stores tokens in `localStorage` and injects via Axios interceptor (`frontend/src/api/api.js`)
- 401 responses trigger automatic token refresh with request queue; on refresh failure, redirect to `/login`
- Frontend protected routes wrapped in `PrivateRoute` — redirects unauthenticated users to `/login`

### Course Access / Locking Logic

Defined in `content/views.py` `ModuleViewSet`:
- Lessons have transient status: `"completed"` | `"unlocked"` | `"locked"` (computed per-request, not stored in DB)
- Locking is computed globally across the entire module (all submodules) using a flat ordered query
- Only the next incomplete lesson in sequence is `"unlocked"`; all others after it are `"locked"`
- Premium modules require enrollment or `Profile.is_premium = True`
- `CourseEnrollment` tracks active enrollment; `is_enrolled` and `can_access` flags added to responses
- Free modules: accessible to everyone. Paid modules: enrolled users only. Premium-only: enrolled OR premium users
- Submodules are removed from response if user lacks access

### Lesson Types

Six types defined in `content/models.py` `Lesson.LessonType` with short codes used throughout:

| Code | Type | Frontend Component | Completion Mechanism |
|------|------|--------------------|---------------------|
| `READ` | Reading Material | `ReadingView` — splits by `---`, multi-step nav | Mark complete on final step |
| `VID` | Video Content | `VideoView` — Bunny iframe > YouTube > ReactPlayer | Manual mark complete |
| `SIM` | Interactive Simulation | `SimulationView` — iframe with time tracking | Manual mark complete |
| `QUIZ` | Quiz / Assessment | `QuizView` — step-by-step, single question per screen | Auto-complete on passing score |
| `PROB` | Problem Solving | `ProblemSolvingView` — parses STEP:/HINT:/SOLUTION: from text | Mark complete on all steps |
| `AI` | AI Tutor Session | `AITutorView` — chat interface with usage stats | Mark complete after interactions |

The `LessonDetailPage` switches on `lesson.lesson_type` to render the appropriate component.

### AI Tutor Secure Proxy

The Gemini API key lives only on the backend (`ai_tutor/views.py` `AIAskView`). The frontend posts to `/api/ai/ask/` with a lesson ID and question (max 2000 chars); the backend:
1. Validates lesson exists and question length
2. Checks subscription status (`ai_tutor/services.py` `SubscriptionService`)
3. Enforces monthly chat/token limits per subscription tier
4. Builds prompt from lesson context + user question + optional ai_tutor_config
5. Calls Gemini API (falls back to simulated response if API key missing/errored)
6. Records usage in `AIChatUsage`

### Subscription & Payment Flow

- `SubscriptionService` (all static methods) handles: get/create subscription, check access, usage limits, record usage
- All users get a FREE subscription auto-created on first AI request
- Plans seeded by `python manage.py setup_subscription_plans` (7 plans: Free, Basic/Premium/Pro monthly+yearly)
- `DEMO_MODE=True` allows subscription creation without real payment processing
- Lemon Squeezy webhook (`LemonSqueezyWebhookView`) handles: `order_created`, `subscription_created`, `subscription_updated`
- Payment confirmation uses `select_for_update()` + `@transaction.atomic` to prevent race conditions
- **Signal sync**: `post_save` on Subscription automatically syncs `Profile.is_premium` (in `ai_tutor/signals.py`)

### Blog Content Gating

- Posts use slug-based URLs (lookup_field = 'slug')
- `PostDetailSerializer.get_content()` returns content only if post is not premium OR user has active non-FREE subscription
- List view uses `PostListSerializer` (no content), detail view uses `PostDetailSerializer`

### Frontend Architecture

- **Auth state**: React Context in `frontend/src/store/authContext.jsx` — use `useAuth()` hook
- **API services**: One file per domain in `frontend/src/api/` (authService, contentService, aiService, assessmentService, paymentService, subscriptionService, profileService, blogService)
- **API client**: `frontend/src/api/api.js` — Axios with 30s timeout, automatic token refresh on 401, request queue during refresh
- **Routing**: `frontend/src/routes/AppRoutes.jsx` — public routes (no layout); MainLayout routes (header + sidebar for auth, header + footer for guest); protected routes use `PrivateRoute`
- **Error boundaries**: `ErrorBoundary` component wraps each page route
- **Styling**: Tailwind CSS v4 (utility-first, no CSS component files), `@tailwindcss/typography` for markdown prose
- **Markdown rendering**: `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + `react-syntax-highlighter`

### Rate Limiting

- Global: `AnonRateThrottle` 20/min, `UserRateThrottle` 60/min
- Auth endpoints (register, password reset, login): `AuthRateThrottle` 5/min
- Payment endpoints: `PaymentRateThrottle` 10/min
- Custom throttle classes in `backend/throttles.py`
- Throttling disabled in test settings

### Key Settings

- `DEBUG` defaults to `False` (safe for production)
- CORS defaults to localhost:5173 origins (no allow-all fallback)
- Production security headers (HSTS, secure cookies, etc.) auto-enabled when `DEBUG=False`
- Default REST framework permission: `IsAuthenticated` (override per-view for public endpoints)
- Pagination: 20 items/page globally
- Database: PostgreSQL only (no SQLite fallback); tests use in-memory SQLite via `backend/test_settings.py`
- Email: Console backend when `DEBUG=True`; Resend API in production
- Deployment: Docker + Railway (`railway.toml`) with gunicorn, auto-migration on start
