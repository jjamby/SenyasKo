# SenyasKo backend

FastAPI and SQLite provide accounts, private messages, saved drafts, and learner progress. The SQLite file is created automatically at `backend/data.sqlite3` and is excluded from Git.

## First-time setup

Install Python 3.12 or newer, then from `backend`:

```cmd
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
```

This computer already has the project virtual environment installed. Start the API in one terminal:

```cmd
cd C:\Users\bonkc\Documents\SenyasKo\backend
start.cmd
```

Start the frontend in another terminal:

```cmd
cd C:\Users\bonkc\Documents\SenyasKo\frontend
npm run dev
```

Open the Vite URL. Vite forwards `/api` requests to `http://127.0.0.1:8000`. The backend health endpoint is `http://127.0.0.1:8000/api/health`; interactive API documentation is at `/docs`.

Run backend checks with `.venv\Scripts\python.exe -m pytest -q`.

For an HTTPS deployment, set `SENYASKO_COOKIE_SECURE=1`, set `SENYASKO_ALLOWED_ORIGINS` to the frontend origin, and serve the frontend and API through the same origin. Back up the SQLite database. Add database migrations and account recovery before inviting real users.

Sign recognition, instructor tools, and email password reset are not implemented yet. The practice screen can record that a learner explored a lesson; it does not assess signing accuracy.
