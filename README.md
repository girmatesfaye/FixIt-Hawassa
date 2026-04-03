# FixIt Hawassa

A full-stack service marketplace platform for Hawassa, Ethiopia.

## Project Structure

```
FixIt-Hawassa-/
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
