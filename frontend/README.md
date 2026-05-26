# CustodyCore Frontend

Next.js 15 frontend for the CustodyCore Digital Evidence Management System.

## Stack

- **Next.js 15** (App Router)
- **Tailwind CSS** (custom design system tokens)
- **recharts** (dashboard charts)
- **lucide-react** (icons)
- **Material Symbols** (Google Fonts CDN — outlined icons)

## Setup

```bash
npm install
cp .env.local.example .env.local   # or edit .env.local directly
npm run dev
```

Default dev URL: `http://localhost:3001` (backend must run on `http://localhost:3000`)

## Environment

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Backend base URL (used as fallback) |

## API Proxy

All `/api/*` calls from the frontend are proxied to `http://localhost:3000/api/*` via Next.js rewrites (`next.config.ts`). The backend never needs CORS headers for frontend use.

## Pages

| Route | Page | Backend Endpoints |
|---|---|---|
| `/dashboard` | KPI cards, charts, recent transfers | `GET /api/dashboard/stats`, `GET /api/transfers` |
| `/cases` | Case list + create + detail panel | `GET /api/cases`, `POST /api/cases` |
| `/evidence` | Evidence table + filters | `GET /api/evidence` |
| `/evidence/new` | Create evidence form | `POST /api/evidence` |
| `/lab` | Lab test table + turnaround stats | `GET /api/lab-tests`, `POST /api/lab-tests` |
| `/audit` | Chain-of-custody timeline (search by asset tag) | `GET /api/audit` |
| `/personnel` | Staff table + create/edit | `GET /api/personnel`, `POST /api/personnel`, `PUT /api/personnel/:id` |
| `/disclosure` | Disclosure requests + activity log | `GET /api/disclosure`, `POST /api/disclosure`, `GET /api/disclosure/:id/logs` |
| `/ai-summaries` | AI case briefs + generate | `GET /api/ai/summaries`, `POST /api/ai/summaries/generate` |
| `/settings` | API config + system info | `GET /api/health` |
| `/login` | Login UI (auth not enforced) | — |

## Backend Endpoint Reference

```
GET    /api/dashboard/stats
GET    /api/cases?status=&priority=
POST   /api/cases
GET    /api/cases/:id

GET    /api/evidence?status=&type=&caseId=
POST   /api/evidence
GET    /api/evidence/:id

GET    /api/lab-tests?status=
POST   /api/lab-tests
GET    /api/lab-tests/:id

GET    /api/transfers?limit=
GET    /api/audit?assetTag=&limit=

GET    /api/personnel
POST   /api/personnel
PUT    /api/personnel/:id

GET    /api/disclosure?status=
POST   /api/disclosure
GET    /api/disclosure/:id/logs

GET    /api/ai/summaries
POST   /api/ai/summaries/generate   { caseId: number }

GET    /api/health
```

## Components

| Component | Purpose |
|---|---|
| `Sidebar` | Left nav with icon + label links |
| `TopBar` | Breadcrumb, search, notifications, user chip |
| `StatusBadge` | Color-coded status pill |
| `Modal` | Generic overlay modal |

## Running with Backend

```bash
# Terminal 1 — backend
cd /path/to/custodycore-backend
npm run dev   # listens on :3000

# Terminal 2 — frontend
cd /path/to/custodycore-frontend
npm run dev   # listens on :3001
```

Open `http://localhost:3001` → auto-redirects to `/dashboard`.
