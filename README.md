# IBH Company — Model Application Platform

Full-stack model application portal with admin dashboard.

**Stack:** React 18 + TypeScript + Tailwind CSS · Node.js + Express + TypeScript · PostgreSQL

---

## Project Structure

```
ibh-app/
├── backend/    Node.js + Express API  (port 4000)
└── frontend/   React + Vite + Tailwind (port 5173)
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1 — Create the database

```bash
createdb ibh_models
```

### 2 — Backend

```bash
cd backend
npm install

# Copy env and fill in your values
cp .env.example .env

# Create all tables
npm run db:migrate

# Seed the default admin user
npm run db:seed

# Start dev server
npm run dev
# → http://localhost:4000
```

**Default admin login** (change after first login!):
| Field    | Value                  |
|----------|------------------------|
| Email    | admin@ibhcompany.com   |
| Password | IBH@admin2024!         |

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:4000` automatically.

---

## Environment Variables (`backend/.env`)

| Variable        | Description                                       | Required |
|-----------------|---------------------------------------------------|----------|
| `DATABASE_URL`  | PostgreSQL connection string                      | ✅       |
| `JWT_SECRET`    | Secret key for signing JWT tokens                 | ✅       |
| `JWT_EXPIRES_IN`| Token expiry e.g. `7d`                            | ✅       |
| `APP_URL`       | Backend base URL — used to build photo URLs       | ✅ prod  |
| `SMTP_HOST`     | SMTP host e.g. `smtp.gmail.com`                   | ✅       |
| `SMTP_PORT`     | SMTP port — usually `587`                         | ✅       |
| `SMTP_USER`     | SMTP username / email address                     | ✅       |
| `SMTP_PASS`     | SMTP password or app password                     | ✅       |
| `EMAIL_FROM`    | From address e.g. `IBH Company <no-reply@…>`      | ✅       |
| `ADMIN_EMAIL`   | Where new application notifications are sent      | ✅       |
| `FRONTEND_URL`  | Frontend origin for CORS e.g. `http://localhost:5173` | ✅   |

> **Gmail tip:** Use an [App Password](https://support.google.com/accounts/answer/185833) — not your main password.

---

## File Uploads

Photos and generated agreement PDFs are stored on the **local filesystem**:

- Development: `backend/uploads/` (created automatically)
- Production on Render: mount a Persistent Disk at `/var/data` — the app writes there automatically when `NODE_ENV=production`

Files are served publicly at `http://localhost:4000/uploads/<key>`.

---

## API Endpoints

### Public
| Method | Path              | Description               | Rate limit        |
|--------|-------------------|---------------------------|-------------------|
| POST   | /api/applications | Submit model application  | 5 / IP / hour     |

### Admin (requires `Authorization: Bearer <token>`)
| Method | Path                                 | Description                    |
|--------|--------------------------------------|--------------------------------|
| POST   | /api/auth/login                      | Admin login → JWT token        |
| GET    | /api/auth/me                         | Get current admin profile      |
| GET    | /api/applications                    | List + search + paginate       |
| GET    | /api/applications/stats              | Dashboard stat counts          |
| GET    | /api/applications/:id                | Single application + logs      |
| PATCH  | /api/applications/:id/status         | Update status + email model    |
| POST   | /api/applications/:id/send-agreement | Generate PDF + email to model  |
| DELETE | /api/applications/:id                | Hard delete application        |

---

## Features

| Feature | Details |
|---------|---------|
| 7-step application wizard | React Hook Form + Zod validation per step |
| Photo upload | Drag & drop, preview, stored to local disk |
| Email on submit | HTML email to model (confirmation) + admin (notification) |
| Status management | pending → reviewing → approved / rejected / waitlisted |
| Status email | Auto-emails model on every status change |
| Agreement PDF | PDFKit generates branded IBH Upfront Agreement |
| Agreement email | PDF attached and sent directly to model's inbox |
| Admin dashboard | Stats cards + searchable paginated table |
| Application detail | Full profile, photo gallery, status controls, activity log |
| JWT auth | Admin portal protected with HS256 JWT |
| Rate limiting | 5 submissions/hr per IP · 200 API req/15min |
| Security | Helmet, CORS, bcrypt password hashing |
| Activity log | Timestamped audit trail for every status change |

---

## Database Schema

```
applications   — full model application data + photo file keys + status
admins         — admin users with bcrypt hashed passwords
activity_log   — timestamped audit trail (submitted, status_changed, agreement_sent)
```

---

## Production Build

```bash
# Backend
cd backend
npm run build
node dist/index.js

# Frontend
cd frontend
npm run build
# Serve the dist/ folder from any static host (Netlify, Vercel, Render, etc.)
```
