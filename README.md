# MedScribe

MedScribe is an AI-assisted clinical documentation application. The active stack is a React/Vite frontend, a FastAPI backend, and PostgreSQL.

## Local development

1. Create a PostgreSQL database named `medscribe` and copy `backend/.env.example` to `backend/.env`.
2. Start the backend in a Python 3.11+ environment:

   ```powershell
   cd backend
   pip install -r requirements.txt
   alembic upgrade head
   python seed.py
   uvicorn app.main:app --reload --port 8000
   ```

3. In a second terminal, run the frontend:

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

Open http://localhost:5173. API documentation is at http://localhost:8000/docs.

## Configuration and deployment

Set a non-default `JWT_SECRET`, a PostgreSQL `DATABASE_URL`, and `GROQ_API_KEY`. Do not commit `.env` files. Production must set `ENVIRONMENT=production` and explicit `CORS_ORIGINS`.

### Vercel and Neon

Deploy two Vercel projects from the same repository:

- API project root: `backend`. Vercel recognizes the FastAPI instance at `app/main.py`.
- Frontend project root: `frontend`. Set `VITE_API_BASE_URL` to `https://YOUR-API.vercel.app/api/v1` during the frontend build.

Create a Neon database and set the API project's `DATABASE_URL` to its **pooled** connection string, plus `JWT_SECRET`, `GROQ_API_KEY`, `ENVIRONMENT=production`, and `CORS_ORIGINS` containing your exact frontend URL. Run `alembic upgrade head` against Neon before the first deployment and whenever database migrations are added.

Vercel Functions accept request bodies up to 4.5 MB, so audio uploads are limited to 4 MB in this deployment. Support for larger recordings requires direct object-storage uploads.
