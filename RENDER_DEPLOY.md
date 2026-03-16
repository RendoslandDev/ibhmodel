# Deploying IBH App to Render

## Overview

You will deploy 3 services on Render:

| Service         | Type         | Plan |
|-----------------|--------------|------|
| ibh-postgres    | PostgreSQL   | Free |
| ibh-backend     | Web Service  | Free |
| ibh-frontend    | Static Site  | Free |

---

## Step 1 — Push Code to GitHub

1. Create a new GitHub repository (e.g. `ibh-model-app`)
2. Push the entire `ibh-app/` folder as the repo root:

```bash
cd ibh-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ibh-model-app.git
git push -u origin main
```

> The repo root must contain `render.yaml`, `backend/`, and `frontend/` folders.

---

## Step 2 — Deploy with Render Blueprint (Recommended)

This deploys all 3 services automatically from `render.yaml`.

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New → Blueprint**
3. Connect your GitHub account and select your repo
4. Render detects `render.yaml` and shows a preview of all 3 services
5. Click **Apply** — Render provisions the DB, backend, and frontend together

---

## Step 3 — Set Environment Variables

After the Blueprint deploys, go to **ibh-backend → Environment** and fill in these variables (marked `sync: false` in render.yaml — you must add them manually):

| Variable               | Where to get it                                  |
|------------------------|--------------------------------------------------|
| `AWS_ACCESS_KEY_ID`    | AWS IAM Console → Your user → Security Credentials |
| `AWS_SECRET_ACCESS_KEY`| AWS IAM Console (only shown once on creation)    |
| `AWS_REGION`           | Your S3 bucket region, e.g. `us-east-1`         |
| `AWS_S3_BUCKET`        | Your S3 bucket name                              |
| `SMTP_HOST`            | e.g. `smtp.gmail.com`                            |
| `SMTP_PORT`            | `587`                                            |
| `SMTP_USER`            | Your Gmail address                               |
| `SMTP_PASS`            | Gmail App Password (see below)                   |
| `EMAIL_FROM`           | `IBH Company <noreply@ibhcompany.com>`           |
| `ADMIN_EMAIL`          | Your admin notification email                    |

> **JWT_SECRET** and **DATABASE_URL** are set automatically by Render Blueprint.

---

## Step 4 — Set Frontend Environment Variable

1. Go to **ibh-frontend → Environment**
2. Add:

| Variable       | Value                                        |
|----------------|----------------------------------------------|
| `VITE_API_URL` | Your backend URL, e.g. `https://ibh-backend.onrender.com` |

3. Trigger a **Manual Deploy** on ibh-frontend so it rebuilds with the new var.

---

## Step 5 — Run Database Migration & Seed

The `render.yaml` build command already includes `npm run db:migrate && npm run db:seed`.

This runs automatically on every deploy. After first deploy:

- **Admin login:** `admin@ibhcompany.com`
- **Admin password:** `IBH@admin2024!`
- ⚠️ Change this immediately after first login.

To run manually via Render Shell:
```bash
# In Render Dashboard → ibh-backend → Shell
npm run db:migrate
npm run db:seed
```

---

## Step 6 — Configure AWS S3

1. Create an S3 bucket (private, no public access)
2. Add this CORS policy to the bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://ibh-frontend.onrender.com",
      "https://ibh-backend.onrender.com"
    ],
    "ExposeHeaders": []
  }
]
```

3. Create an IAM user with this minimal policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

---

## Step 7 — Gmail App Password (SMTP)

If using Gmail for emails:

1. Go to your Google Account → Security
2. Enable **2-Step Verification**
3. Go to **App Passwords** → Generate one for "Mail"
4. Use that 16-character password as `SMTP_PASS`

---

## Step 8 — Your Live URLs

After deployment completes:

| Service  | URL                                        |
|----------|--------------------------------------------|
| Frontend | `https://ibh-frontend.onrender.com`        |
| Backend  | `https://ibh-backend.onrender.com`         |
| Admin    | `https://ibh-frontend.onrender.com/admin`  |
| Health   | `https://ibh-backend.onrender.com/health`  |

---

## Manual Deploy (Alternative to Blueprint)

If you prefer to set up each service manually:

### A. Create PostgreSQL Database
1. New → PostgreSQL
2. Name: `ibh-postgres`, Plan: Free
3. Copy the **Internal Database URL**

### B. Create Backend Web Service
1. New → Web Service → Connect GitHub repo
2. **Root Directory:** `backend`
3. **Build Command:** `npm install && npm run build && npm run db:migrate && npm run db:seed`
4. **Start Command:** `node dist/index.js`
5. **Environment:** Node
6. Add all environment variables from Step 3 above
7. Add `DATABASE_URL` = Internal Database URL from step A

### C. Create Frontend Static Site
1. New → Static Site → Connect same GitHub repo
2. **Root Directory:** `frontend`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. Add redirect rule: `/* → /index.html` (for React Router)
6. Add `VITE_API_URL` = backend URL from step B

---

## Keeping the Free Tier Alive

Render free services spin down after 15 minutes of inactivity. Use an uptime monitor to ping your health endpoint every 10 minutes:

- [UptimeRobot](https://uptimerobot.com) (free) — monitor `https://ibh-backend.onrender.com/health`
- This prevents cold start delays for your models.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `SSL SYSCALL EOF` | Already handled — `ssl: { rejectUnauthorized: false }` is set in pool.ts |
| CORS error on frontend | Make sure `VITE_API_URL` is set and frontend was redeployed |
| Photos not uploading | Check AWS credentials and S3 bucket name in backend env vars |
| Emails not sending | Verify Gmail App Password (not your regular Gmail password) |
| DB migration fails | Check `DATABASE_URL` is set correctly in backend env vars |
| Admin login fails | Run `npm run db:seed` from Render Shell |
