# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered learning platform with a Django REST Framework backend and React + Vite frontend. Users enroll in courses (Module -> SubModule -> Lesson hierarchy), complete different lesson types, and interact with an AI tutor powered by Google Gemini. Subscriptions control AI tutor access limits.

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

# Create superuser
python manage.py createsuperuser

# Seed subscription plans (required after first migration)
python manage.py setup_subscription_plans

# Run tests
python manage.py test
python manage.py test users              # single app
python manage.py test content.tests.LessonLockingTest  # single test class

# Lint
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

**Required**: `.env` in the project root. `SECRET_KEY` is mandatory (no default).

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
| `content` | Modules, SubModules, Lessons, enrollment, progress tracking |
| `ai_tutor` | Gemini API proxy, subscriptions, usage metering |
| `assessment` | Quizzes, questions, answer choices, attempt scoring |
| `payments` | Payment transactions, Stripe/PayPal integration, free enrollment |
| `progress` | Minimal, designed for future progress expansion |
| `backend` | Django project config, root URL routing, custom permissions, throttles |

### API URL Structure

```
/api/users/         -> auth endpoints (register, verify-email, password-reset, etc.)
/api/content/       -> modules, submodules, lessons
/api/ai/            -> AI tutor (/ask/), subscriptions, plans, usage
/api/assessment/    -> quizzes, attempts
/api/payments/      -> transactions, create-intent, confirm, enroll-free
/api/token/         -> JWT obtain (POST username+password)
/api/token/refresh/ -> JWT refresh
/api/docs/          -> Swagger UI (API documentation)
/api/schema/        -> OpenAPI schema
/admin/             -> Django admin
```

### Authentication Flow

- Registration creates an **inactive** user + sends verification email
- Email verification activates the account
- JWT tokens: access (1 hour) + refresh (7 days) with rotation and blacklisting
- Frontend stores tokens in `localStorage` and injects via Axios interceptor (`frontend/src/api/api.js`)
- 401 responses trigger automatic token refresh; on refresh failure, redirect to `/login`
- Frontend protected routes wrapped in `PrivateRoute` — redirects unauthenticated users to `/login`

### Course Access / Locking Logic

Defined in `content/views.py` `ModuleViewSet`:
- Lessons have status: `"completed"` | `"unlocked"` | `"locked"`
- Locking is computed globally across the entire module (all submodules) using a flat ordered query
- Only the next incomplete lesson in sequence is `"unlocked"`; all others after it are `"locked"`
- Premium modules require enrollment or `Profile.is_premium = True`
- `CourseEnrollment` tracks active enrollment; `is_enrolled` and `can_access` flags added to responses
- Lesson completion endpoints check enrollment access before allowing progress

### AI Tutor Secure Proxy

The Gemini API key lives only on the backend (`ai_tutor/views.py` `AIAskView`). The frontend posts to `/api/ai/ask/` with a lesson ID and question (max 2000 chars); the backend:
1. Validates lesson exists and question length
2. Checks subscription status (`ai_tutor/services.py` `SubscriptionService`)
3. Enforces monthly chat/token limits per subscription tier
4. Builds prompt from lesson context + user question
5. Calls Gemini API and returns response
6. Records usage in `AIChatUsage`

### Subscription Tiers

Four tiers: FREE, BASIC, PREMIUM, PRO — defined in `ai_tutor/models.py`. All users get a FREE subscription auto-created on first AI request. Plans are seeded by `python manage.py setup_subscription_plans`.

### Payment Flow

- `DEMO_MODE=True` in settings allows subscription creation without real payment processing
- Without DEMO_MODE, paid subscriptions are created as PENDING and require payment confirmation
- Payment confirmation uses `select_for_update()` to prevent race conditions
- Free course enrollment goes through `EnrollFreeCourseView`

### Frontend Architecture

- **Auth state**: React Context in `frontend/src/store/authContext.jsx` — use `useAuth()` hook
- **API services**: One file per domain in `frontend/src/api/` (authService, contentService, aiService, etc.)
- **API client**: `frontend/src/api/api.js` — Axios with 30s timeout, automatic token refresh on 401, request queue during refresh
- **Routing**: `frontend/src/routes/AppRoutes.jsx` — public routes without sidebar; protected routes use `PrivateRoute` + `MainLayout`
- **Error boundaries**: `ErrorBoundary` component wraps each page route
- **Lesson rendering**: `LessonDetailPage` switches on `lesson.lesson_type` to render one of six specialized components in `frontend/src/components/lessons/`

### Rate Limiting

- Global: `AnonRateThrottle` 20/min, `UserRateThrottle` 60/min
- Auth endpoints (register, password reset): `AuthRateThrottle` 5/min
- Payment endpoints: `PaymentRateThrottle` 10/min
- Custom throttle classes in `backend/throttles.py`

### Key Settings

- `SECRET_KEY` is **required** — app raises `ImproperlyConfigured` if missing
- `DEBUG` defaults to `False` (safe for production)
- CORS defaults to localhost:5173 origins (no allow-all fallback)
- Production security headers (HSTS, secure cookies, etc.) auto-enabled when `DEBUG=False`
- Default REST framework permission: `IsAuthenticated` (override per-view for public endpoints)
- Pagination: 20 items/page globally
- Database: PostgreSQL only (no SQLite fallback)
- Email: Console backend when `DEBUG=True`; SMTP configured via env vars in production
- Logging: Per-app loggers configured in `LOGGING` setting
- API docs: drf-spectacular at `/api/docs/`
