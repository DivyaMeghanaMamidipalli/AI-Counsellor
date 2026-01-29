# Copilot instructions for AI Counsellor

## Big picture
- Full-stack app: FastAPI backend in `backend/app`, React + Vite frontend in `frontend/src`.
- Data flow: UI → Axios client → REST API → SQLAlchemy ORM → PostgreSQL. See `frontend/src/api/client.ts` and `backend/app/main.py`.
- Stage progression is **backend-owned**. `backend/app/stage_logic.py` computes stages; frontend only displays `current_stage` from API responses (never re-calculate).

## Key workflows
- Backend dev server: `uvicorn app.main:app --reload` from `backend` (port 8000).
- Frontend dev server: `npm run dev` from `frontend` (port 5173).
- API base URL: `VITE_API_BASE_URL` in `frontend/.env` (fallback `http://localhost:8000`).

## Frontend conventions
- API layer in `frontend/src/api/*` and shared Axios client in `frontend/src/api/client.ts`.
  - Auth token stored in `localStorage` key `authToken`; interceptor adds `Authorization: Bearer`.
  - 401 triggers token clear and redirect to `/login`.
- Global state uses Zustand stores in `frontend/src/store/*`.
  - Example: `frontend/src/store/universitiesStore.ts` uses a 10‑minute cache and optimistic updates for shortlist/lock/unlock.
- Page layout uses `MainLayout` in `frontend/src/components/layout/MainLayout.tsx` and shared UI in `frontend/src/components/common/*`.
- Styling uses Tailwind with a nude/sand palette (see `frontend/tailwind.config.js`).

## Backend conventions
- Routes grouped by domain: `auth.py`, `onboarding.py`, `dashboard.py`, `universities.py`, `tasks.py`.
- University lock/unlock is a commitment step; backend returns warnings on unlock when no other universities are locked (see `backend/app/universities.py`).
- Stage updates are triggered on onboarding completion and university shortlist/lock/unlock (`backend/app/stage_logic.py`).

## Cross-component patterns
- After lock/unlock actions, frontend refreshes dashboard to sync stage (see `frontend/src/pages/Universities.tsx`).
- Universities flow: recommendations → shortlist → lock; removing from shortlist is blocked when locked by backend.

## Where to look
- UI pages: `frontend/src/pages/*` (e.g., `Universities.tsx`, `Dashboard.tsx`).
- API schemas: `backend/app/schemas.py`.
- Data models: `backend/app/models.py`.
