# MedScribe

MedScribe is a role-based, AI-assisted clinical documentation platform. Doctors can create patient records, capture or upload encounter audio, review transcripts, generate editable clinical notes, finalize reports, issue prescriptions, and export PDFs. Patients can securely view finalized reports and prescriptions, while administrators have system-wide oversight.

## Live deployment

- Application: [medscribe2.vercel.app](https://medscribe2.vercel.app/)
- API: [medscribe-api.vercel.app](https://medscribe-api.vercel.app/)
- API documentation: [medscribe-api.vercel.app/docs](https://medscribe-api.vercel.app/docs)

## Highlights

- Role-based doctor, patient, and administrator portals with JWT-protected APIs.
- Audio capture/upload with Groq Whisper transcription and audio playback verification before report generation.
- Evidence-grounded AI clinical-note generation using Groq, custom templates, editable drafts, finalization, version tracking, and PDF export.
- Duplicate-submission protection and clear progress feedback for long-running operations such as transcription, AI generation, and PDF preparation.
- PostgreSQL persistence on Neon and production deployment through Vercel.

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Axios
- Backend: FastAPI, SQLAlchemy, Alembic, Pydantic
- Database: PostgreSQL / Neon
- AI services: Groq Whisper and Groq chat completions
- Deployment: Vercel

## Run locally

### 1. Clone the repository

```powershell
git clone https://github.com/Nikhil-Gowda-S/medscribe2.git
cd medscribe2
```

### 2. Configure and start the backend

Create `backend/.env` with your own values. Do not commit this file.

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
GROQ_API_KEY=your-groq-api-key
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:5173"]
```

Install backend packages, create the schema, optionally create demo data, and start the API:

```powershell
cd backend
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

### 3. Configure and start the frontend

In a second terminal:

```powershell
cd frontend
npm ci
```

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Then run:

```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The local API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

`python seed.py` creates demonstration accounts for local development only. Change or remove all demo credentials before sharing a deployed environment.

## Deploy your own copy

Deploy two Vercel projects from this repository:

1. **Backend project**: select `backend` as the root directory.
2. **Frontend project**: select `frontend` as the root directory.

Create a Neon PostgreSQL database, run `alembic upgrade head` against it, and add these variables to the **backend Vercel project**:

```text
DATABASE_URL=<Neon pooled PostgreSQL connection string>
JWT_SECRET=<long random secret>
GROQ_API_KEY=<Groq API key>
ENVIRONMENT=production
CORS_ORIGINS=["https://your-frontend-domain.vercel.app"]
```

Add this variable to the **frontend Vercel project**, then redeploy the frontend:

```text
VITE_API_BASE_URL=https://your-api-domain.vercel.app/api/v1
```

To bootstrap the first production administrator, temporarily add the following to the **backend Production** environment variables, redeploy the backend, sign in, and then remove both variables:

```text
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=<unique password of at least 12 characters>
```

## Notes

- Keep `.env` and `.env.local` files out of Git; they contain secrets.
- Vercel Functions accept request bodies up to 4.5 MB, so this deployment limits audio uploads to 4 MB. Larger recordings require direct object-storage uploads.
- The PDF download actions use authenticated API requests, so patients can download only their own finalized reports.
