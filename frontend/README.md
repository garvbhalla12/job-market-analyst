# Job Market Analyst: Frontend

React + Vite + Tailwind dashboard for the existing **Job Market Analyst** FastAPI backend.
It shows analytics only from real API responses (no mock data).

## Stack
React 18 · Vite 5 · JavaScript · Tailwind CSS 3 · Axios · React Router DOM 6 · Recharts · Lucide React

## Install location
Extract so this file ends up at `D:\job_market_analyst\frontend\README.md`
(i.e. extract the ZIP into `D:\job_market_analyst`; it contains a single `frontend` folder).

## Before you start: patch the backend (2 small edits)
Your backend currently has **no CORS middleware** and **no `GET /api/auth/me`** route.
Follow [`backend_patch/README.md`](backend_patch/README.md). CORS is required for the browser to reach the API.

## Run

1. Start the backend the way you already do. It must be on http://127.0.0.1:8000. The backend uses flat imports
   (`from database import ...`), so start it from inside the `backend` folder:
   ```
   cd D:\job_market_analyst\backend
   uvicorn main:app --reload
   ```
2. Start the frontend (Node.js 18+ required):
   ```
   cd D:\job_market_analyst\frontend
   copy .env.example .env
   npm install
   npm run dev
   ```
3. Open http://localhost:5173 and create an account (or sign in).

Production build: `npm run build` (output in `dist/`), preview with `npm run preview`.

## Environment variables
| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Base URL of the FastAPI backend |

No secrets belong in the frontend. `SECRET_KEY` stays in the backend `.env`.
If you change the frontend port, add that origin to the backend CORS list.

## How it maps to your backend

| Frontend | Endpoint |
| --- | --- |
| Sign up | `POST /api/auth/signup` `{ full_name, email, password }` (password 8-128 chars) |
| Sign in | `POST /api/auth/login` `{ email, password }` → `{ access_token, refresh_token }` |
| Refresh | `POST /api/auth/refresh` `{ refresh_token }` → new token pair (rotation) |
| Logout | `POST /api/auth/logout` `{ refresh_token }` |
| Profile | `GET /api/auth/me` (see backend patch) |
| Overview, KPIs | `GET /api/analytics/overview` |
| Skills | `GET /api/analytics/skills?limit=` |
| Salary | `GET /api/analytics/salary` |
| Locations | `GET /api/analytics/locations?limit=` |
| Workplace / Employment / Roles | `GET /api/analytics/workplace`, `/employment`, `/roles` |
| Companies | `GET /api/analytics/companies?limit=` |
| Fresher | `GET /api/analytics/fresher` |
| Job explorer | `GET /api/analytics/jobs?search=&location=&workplace_type=&employment_type=&limit=` (limit 1-100) |

## Authentication design
- The backend returns tokens in the JSON body (no cookies), so the **access token is kept in memory** and the
  **refresh token in `localStorage`** (needed to restore the session after a reload).
- Refresh tokens are **single-use** (the backend revokes the old one on every refresh). The Axios layer therefore
  shares **one in-flight refresh** between all concurrent requests, retries each failed request **once**, and never
  retries the auth endpoints, so there are no refresh loops.
- If a refresh is rejected, the session is cleared and the user is sent to the login page. A pure network failure
  does *not* log the user out.
- Trade-off: anything in `localStorage` is readable by injected scripts (XSS). This is the standard compromise
  when the API returns refresh tokens in JSON; a cookie-based refresh flow would need backend changes.

## Project structure
```
frontend/
  src/
    components/
      common/    Card, StatCard, States (skeleton/error/empty), Notice, Field, PasswordInput, AuthShell…
      layout/    Sidebar, Topbar, AppLayout, ProtectedRoute, Logo, navItems
      charts/    ChartCard, HBarChart, VBarChart, DonutChart, ChartTooltip, palette
      dashboard/ RankedList
      jobs/      JobsTable (table on desktop, cards on mobile)
    pages/       Login, Signup, Dashboard, SkillsAnalytics, SalaryAnalytics, LocationAnalytics,
                 CompanyAnalytics, FresherJobs, JobExplorer, Profile, NotFound
    services/    api.js (Axios + interceptors), authService.js, analyticsService.js, tokenStore.js
    context/     AuthContext.jsx
    hooks/       useApi.js (loading/error/retry/cancel), useDebounce.js
    utils/       format.js, errors.js, validation.js, jwt.js
  backend_patch/ the two backend additions described above
```

## Data notes shown in the UI
- The dataset is a **collected sample** of postings, not the whole job market.
- Salaries are **USD**; annual (`/yr`) and hourly (`/hr`) are always analysed separately.
- "Fresher" results are **potential** opportunities found by keyword matching, not verified eligibility.

## Known limitations (they come from what the API provides)
- **Salary distribution:** `/api/analytics/salary` returns summary statistics per pay period (min, median, average, max,
  counts), not histogram buckets, so the page compares those statistics instead of drawing a binned distribution.
- **Fresher listings:** `/api/analytics/fresher` returns counts only. The listings on that page come from the Job
  Explorer API (employment type = internship, or a title/company keyword search); job descriptions are not exposed.
- **"Recent job postings"** shows the first rows the Job Explorer API returns. The dataset has no posting date.
- **No pagination or application links:** the jobs API returns up to 100 rows per request and no URLs.
- Job rows with a blank workplace type are reported by the API as "Not Specified" in aggregates, but cannot be used as a filter value.
