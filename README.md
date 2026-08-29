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

Deploy FastAPI and PostgreSQL together, then deploy the Vite frontend with `/api` proxied to FastAPI. Run `alembic upgrade head` during releases. The retired Next.js/Prisma instructions do not apply to this version.
