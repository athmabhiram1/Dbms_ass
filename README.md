# CustodyCore — Forensic Evidence Chain of Custody System

A full-stack forensic evidence management system with chain-of-custody tracking, lab integration, defense disclosure workflows, and AI-powered case summarisation.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                   │
│                  http://localhost:5173                 │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP (proxy via next.config.ts)
┌──────────────────────▼───────────────────────────────┐
│              Backend API (Express.js)                 │
│                  http://localhost:5000                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Routes   │▶│Controllers│▶│  pg Pool (raw SQL)   │ │
│  └──────────┘ └──────────┘ └──────────┬───────────┘ │
└────────────────────────────────────────┼──────────────┘
                                         │ TCP :54322
┌────────────────────────────────────────▼──────────────┐
│              PostgreSQL 17 — custodycore               │
│  11 tables · 9 ENUMs · 24 indexes · 2 triggers · 1 view│
└───────────────────────────────────────────────────────┘
                                         ▲
                            ┌──────────────┘
┌───────────────────────────▼───────────────────────────┐
│             AI Microservice (Flask/Python)             │
│                  http://localhost:8000                  │
│  Providers: Ollama · Claude · OpenAI · Template        │
└───────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer            | Technology                                  |
|------------------|---------------------------------------------|
| Database         | PostgreSQL 17                               |
| Backend          | Node.js 22 · Express 4 · pg v8              |
| AI Service       | Python 3.12 · Flask · psycopg2              |
| Frontend         | Next.js · TypeScript · Tailwind · shadcn/ui |
| Orchestration    | Docker Compose                              |

---

## Database Schema (11 Tables)

### ENUMs
`personnel_role`, `case_status`, `case_priority`, `evidence_status`, `transfer_type`, `lab_test_type`, `lab_test_status`, `request_status`, `view_type`

### Lookup Tables
| Table              | Rows | Purpose                              |
|--------------------|------|--------------------------------------|
| `courts`           | 5    | Court contact details                |
| `evidence_types`   | 8    | Evidence classification (weapon, dna…)|
| `storage_locations`| 10   | Physical storage (room, locker, vault)|

### Core Entities
| Table              | Rows | Purpose                              |
|--------------------|------|--------------------------------------|
| `personnel`        | 15   | All actors (officers, pros, defense…) |
| `cases`            | 8    | Legal case container                 |
| `evidence_items`   | 27   | Physical evidence records            |

### Audit & Operations
| Table                | Rows | Purpose                              |
|----------------------|------|--------------------------------------|
| `custody_transfers`  | 148  | Chain-of-custody audit trail         |
| `lab_tests`          | 12   | Lab test requests & results          |
| `evidence_requests`  | 8    | Defense discovery requests           |
| `disclosure_logs`    | 1    | Evidence viewing events              |
| `ai_summaries`       | 4    | AI-generated case summaries          |

### Triggers
- **`trg_auto_dispose_on_case_close`** — AUTO-created when case status changes to `closed`
- **`trg_validate_custody_sequence`** — Rejects transfers where `transfer_timestamp < collected_date`

### View
- **`vw_evidence_audit_trail`** — Full custody audit with officer names, badge numbers, locations, and case metadata

---

## Quick Start

### Prerequisites
- PostgreSQL 17 running with `custodycore` database seeded
- Node.js 18+
- Python 3.11+

### 1. Database (one-time)
```bash
psql -U postgres -d custodycore -f 01_schema.sql
psql -U postgres -d custodycore -f 03_data.sql
psql -U postgres -d custodycore -f 04_triggers.sql
psql -U postgres -d custodycore -f 05_views.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # edit DB credentials
npm install
npm start
# → http://localhost:5000
```

### 3. AI Service
```bash
cd ai-service
cp .env.example .env        # optional: set API keys
pip install -r requirements.txt
python server.py
# → http://localhost:8000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 5. Docker (alternative — all services)
```bash
docker compose up -d
```

---

## API Reference

All endpoints return JSON. Base URL: `http://localhost:5000/api`

### Health
```
GET /api/health → 200 { "status": "ok", "service": "custodycore-backend" }
```

### Cases
```
GET  /api/cases                          → 200 [{ case_id, case_number, title, status, … }]
GET  /api/cases/:id                      → 200 { case_id, case_number, title, evidence_count, … }
PATCH /api/cases/:id/close               → 200 { success: true }
GET  /api/cases/:id/evidence             → 200 [{ asset_tag, description, current_status, … }]
```

### Evidence
```
GET  /api/evidence                       → 200 [{ asset_tag, description, case_number, status, … }]
GET  /api/evidence/:tag                  → 200 { asset_tag, description, case_number, … }
GET  /api/evidence/:tag/audit            → 200 [{ asset_tag, transfer_timestamp, from_officer, to_officer, … }]
POST /api/evidence                       → 201 { success: true, evidence_item_id, … }
  Body: { asset_tag, description, case_id, evidence_type_id, collected_date, collected_by }
```

### Custody
```
GET  /api/custody/transfers              → 200 [{ transfer_id, asset_tag, from_name, to_name, … }]
POST /api/custody/transfer               → 201 { success: true, transfer_id, … }
  Body: { evidence_item_id, to_personnel_id, transfer_timestamp, transfer_type, … }
```

### Personnel
```
GET  /api/personnel                      → 200 [{ personnel_id, name, badge_number, role, … }]
POST /api/personnel                      → 201 { success: true, personnel_id, … }
PUT  /api/personnel/:id                  → 200 { success: true }
POST /api/personnel/:id/deactivate       → 200 { success: true }
```

### Lab
```
GET    /api/lab/tests                    → 200 [{ lab_test_id, asset_tag, test_type, status, … }]
POST   /api/lab/tests                    → 201 { success: true, lab_test_id, … }
PATCH  /api/lab/tests/:id                → 200 { success: true }
```

### Disclosure
```
GET  /api/disclosure/requests            → 200 [{ evidence_request_id, asset_tag, attorney_name, status, … }]
POST /api/disclosure/request             → 201 { success: true, evidence_request_id, … }
POST /api/disclosure/log                 → 201 { success: true, disclosure_log_id, … }
```

### Analytics
```
GET  /api/analytics/backlog              → 200 [{ prosecutor_name, case_priority, open_cases, … }]
GET  /api/analytics/lab-turnaround       → 200 [{ test_type, avg_days, total, … }]
GET  /api/analytics/storage              → 200 [{ room, locker, access_level, item_count, … }]
GET  /api/analytics/prosecutor-workload  → 200 [{ name, open_cases, total_tests, … }]
POST /api/analytics/ai/summarise/:id     → 200 { case_id, summary_text, model_used, … }
```

---

## Project Structure

```
dbms_project/
├── 01_schema.sql          # Full schema: 11 tables, 9 ENUMs, indexes, constraints
├── 02_seed_generator.py   # Python seed data generator
├── 03_data.sql             # Seed data (226+ rows across all tables)
├── 04_triggers.sql         # Case-close disposal + custody validation triggers
├── 05_views.sql            # Audit trail view
├── 06_queries.sql          # Analytical SQL queries
├── 07_er_diagram.png       # Entity-relationship diagram
├── 08_report.md            # Project report
├── 09_ai_summariser.py     # Standalone AI summarisation script
├── backend/                # Express.js API server
│   ├── server.js
│   ├── src/
│   │   ├── config/db.js    # pg Pool connection
│   │   ├── middleware/     # Error handler
│   │   ├── controllers/    # 7 controllers (raw SQL)
│   │   └── routes/         # 7 route groups
│   ├── Dockerfile
│   └── package.json
├── ai-service/             # Python AI microservice
│   ├── server.py           # Flask entry point
│   ├── summariser.py       # Core summarisation logic
│   ├── fallback.py         # Template fallback
│   ├── providers/          # Ollama, Claude, OpenAI clients
│   ├── requirements.txt
│   └── config.yaml         # Provider config
├── frontend/               # Next.js frontend
│   ├── app/                # App router pages
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── cases/
│   │   ├── evidence/
│   │   ├── personnel/
│   │   ├── lab/
│   │   ├── disclosure/
│   │   ├── audit/
│   │   ├── ai-summaries/
│   │   └── settings/
│   ├── components/         # Shared UI (Sidebar, TopBar, Modal, StatusBadge)
│   ├── lib/api.ts          # Typed API client
│   ├── next.config.ts      # Proxy to backend :5000
│   └── package.json
├── test/
│   └── index.html          # Interactive API test page
├── docker-compose.yml      # postgres + backend + ai-service
├── .env.example
├── .gitignore
└── README.md
```

---

## AI Service Configuration

Edit `ai-service/config.yaml`:

```yaml
provider: template                       # ollama | claude | openai | template
max_tokens: 500
temperature: 0.7
ollama:
  url: http://host.docker.internal:11434/api/generate
  model: llama3
claude:
  url: https://api.anthropic.com/v1/messages
  model: claude-3-5-sonnet-20241022
openai:
  url: https://api.openai.com/v1/chat/completions
  model: gpt-4o-mini
```

Set `CLAUDE_API_KEY` or `OPENAI_API_KEY` in `.env` to use those providers. The provider can also be selected per-request from the frontend AI Summaries page. When an LLM call fails, the service falls back to a template-based summary.

---

## Design Principles

- **3NF** — All tables are in third normal form; no transitive dependencies
- **Raw SQL** — Backend uses `pg` with `$1` parameterized queries (no ORM)
- **Chain Integrity** — Trigger-enforced constraints prevent tampering with custody sequence
- **Graceful Fallback** — AI service degrades to template summarisation if LLM unavailable
- **Defense-First** — Separate `evidence_requests` and `disclosure_logs` tables enforce legal discovery workflows
