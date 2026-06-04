# Muyaye

A full-stack service marketplace platform for Hawassa, Ethiopia.

## Project Structure

```
Muyaye-/
├── frontend/          ← React + Vite web app (client, worker & admin UI)
│   ├── admin/         ← Admin dashboard pages (inside frontend)
│   ├── components/    ← Shared UI components
│   ├── pages/         ← Client & worker pages
│   ├── services/      ← API service helpers
│   ├── App.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── backend/           ← Node.js + Express REST API
    ├── src/
    │   ├── routes/
    │   ├── models/
    │   ├── middleware/
    │   ├── services/
    │   └── server.ts
    └── package.json
```

## Getting Started

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:3000
```

### Backend (Node.js + Express)

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:4000
```

## Environment Variables

- **frontend**: create a `.env` file in `frontend/` with `VITE_API_BASE_URL=http://localhost:4000`
- **backend**: see `backend/.env.example` for required variables
- If your backend logs a MongoDB Atlas whitelist/network error, add your current public IP to Atlas Network Access: https://www.mongodb.com/docs/atlas/security/ip-access-list/

## Deploying

- Backend (Render):
  - Deploy the `backend/` folder as a Render Web Service.
  - Set environment variables on Render: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (your Vercel URL), `CLOUDINARY_*` and `SMTP_*` as needed.
  - Build command: `npm install && npm run build`
  - Start command: `npm start`

- Frontend (Vercel):
  - Create a new Vercel project from the `frontend/` folder (Framework: Vite).
  - Build command: `npm run build`
  - Output directory: `dist`
  - Add an environment variable `VITE_API_BASE_URL` with the Render backend URL, for example `https://fixit-hawassa-backend.onrender.com`.
  - You can also keep `frontend/.env.production` (included) but it's recommended to set the value in Vercel's Project Settings for secure builds.

Notes:

- After the frontend is deployed, set `FRONTEND_URL` on the Render backend to your Vercel deployment URL so email links and CORS allow the frontend domain.
- The frontend uses `HashRouter`, so Vercel does not require custom SPA rewrite rules for deep links.
