# CyberGuard – Phishing Detection & Email Security System

A full-stack Information Security project that analyzes suspicious **URLs** and **emails** with transparent,
**rule-based** detection, produces explainable security reports (print / PDF), keeps a scan history, teaches
cybersecurity awareness, and includes an admin dashboard.

> CyberGuard does **not** use AI or machine learning. Every point in the risk score comes from a documented rule.
> Automated analysis can never guarantee that a website or email is safe.

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | Next.js 16 (App Router, JavaScript), React 19   |
| Styling        | Tailwind CSS v4                                 |
| Charts / PDF   | Chart.js + react-chartjs-2, jsPDF + autotable   |
| Backend        | Node.js + Express 5 (REST API)                  |
| Database       | MySQL / MariaDB (XAMPP) via `mysql2`            |
| Security       | bcrypt, JWT, helmet, express-rate-limit, express-validator |

---

## 1. Project folder structure

```
CyberGuard/
├── README.md
├── backend/
│   ├── server.js                  # Express entry point (security middleware, routes)
│   ├── .env.example               # Copy to .env (DB credentials, JWT secret)
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── database/
│   │   ├── schema.sql             # Creates cyberguard_db + 5 tables
│   │   ├── sample_data.sql        # Demo users, tips, scans, logs
│   │   └── setup.js               # `npm run db:setup` runs both SQL files
│   ├── detection/
│   │   ├── ruleData.js            # Brand list, shorteners, keywords, phrase lists
│   │   ├── riskLevel.js           # Score → SAFE / SUSPICIOUS / HIGH RISK
│   │   ├── urlAnalyzer.js         # URL phishing engine (8 checks)
│   │   └── emailAnalyzer.js       # Email phishing engine (7 checks + extras)
│   ├── middleware/
│   │   ├── auth.js                # JWT authenticate + requireAdmin
│   │   ├── validate.js            # Input validation & sanitising rules
│   │   ├── rateLimiter.js         # API / login / scan rate limits
│   │   └── errorHandler.js        # 404 + safe error responses
│   ├── controllers/
│   │   ├── authController.js      # register, login, logout, profile, password
│   │   ├── scanController.js      # scans, history, user dashboard stats
│   │   ├── adminController.js     # admin stats, users, scans, logs
│   │   └── tipController.js       # security tips CRUD
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth/*
│   │   ├── scanRoutes.js          # /api/scans/*, /api/history/*, /api/dashboard
│   │   ├── adminRoutes.js         # /api/admin/*  (admin only)
│   │   └── tipRoutes.js           # /api/tips (public)
│   └── utils/
│       ├── activityLogger.js      # Writes to activity_logs
│       └── asyncHandler.js
└── frontend/
    ├── .env.local                 # NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ├── next.config.mjs
    ├── jsconfig.json              # "@/..." import alias
    ├── app/
    │   ├── layout.js              # Root layout + AuthProvider
    │   ├── globals.css            # Dark navy theme, reusable classes, print styles
    │   ├── page.js                # Landing page
    │   ├── login/page.js
    │   ├── register/page.js
    │   ├── awareness/page.js      # Cybersecurity awareness + tips from DB
    │   ├── dashboard/
    │   │   ├── layout.js          # Sidebar shell + login guard
    │   │   ├── page.js            # Stats, charts, recent scans
    │   │   ├── scan-url/page.js
    │   │   ├── scan-email/page.js
    │   │   ├── history/page.js
    │   │   ├── profile/page.js
    │   │   └── report/[type]/[id]/page.js   # Printable / PDF report
    │   └── admin/
    │       ├── layout.js          # Admin-only guard
    │       ├── page.js            # System statistics & charts
    │       ├── users/page.js      # Manage users & roles
    │       ├── scans/page.js      # All URL / email scans
    │       ├── tips/page.js       # Manage educational content
    │       └── logs/page.js       # Activity logs
    ├── components/                # AppShell, Navbar, Footer, Charts, ScanResult, ui…
    └── lib/                       # api.js, AuthContext.js, pdf.js, format.js, awarenessContent.js
```

---

## 2. Database schema (`cyberguard_db`)

| Table           | Key columns                                                                 | Relationships / indexes |
| --------------- | --------------------------------------------------------------------------- | ----------------------- |
| `users`         | id, name, email (unique), password (bcrypt hash), role (`user`/`admin`), created_at | index on role |
| `url_scans`     | id, user_id, submitted_url, risk_score, risk_level, scan_details (JSON), scanned_at | FK → users (CASCADE), index (user_id, scanned_at), index risk_level |
| `email_scans`   | id, user_id, risk_score, risk_level, scan_details (JSON), scanned_at        | FK → users (CASCADE), same indexes |
| `security_tips` | id, title, description, created_at                                          | — |
| `activity_logs` | id, user_id (nullable), activity, created_at                               | FK → users (SET NULL), indexes on user_id, created_at |

The full SQL is in [`backend/database/schema.sql`](backend/database/schema.sql).

**Privacy:** the full email body is never stored. `email_scans.scan_details` keeps only the triggered indicators,
the sender *domain*, word/link counts and a 160-character excerpt where emails, links, long numbers and anything
that looks like `password: …`, `PIN = …`, `OTP …` are replaced with `[redacted]`.

---

## 3. Run the project locally on Windows

### Prerequisites
- **Node.js 20 or newer** – https://nodejs.org (check with `node -v`)
- **XAMPP** (for MySQL/MariaDB) – https://www.apachefriends.org

### Step 1 – Start MySQL
Open the **XAMPP Control Panel** and click **Start** next to **MySQL**. It should turn green on port 3306.

### Step 2 – Backend setup
Open a terminal (PowerShell) in the project folder:

```powershell
cd C:\Users\<you>\Desktop\CyberGuard\backend
npm install
copy .env.example .env
```

Edit `backend\.env`:
- `DB_PASSWORD` – leave empty for default XAMPP (`root` with no password).
- `JWT_SECRET` – set a long random value. Generate one with:
  ```powershell
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

Create the database, tables and sample data:

```powershell
npm run db:setup
```

> Alternative: open http://localhost/phpmyadmin → **Import** → `backend/database/schema.sql`, then `sample_data.sql`.

Start the API (keep this terminal open):

```powershell
npm run dev
```

You should see `CyberGuard API running at http://localhost:5000` and `Connected to MySQL database`.
Check http://localhost:5000/api/health → `{"status":"ok","database":"connected"}`.

### Step 3 – Frontend setup
Open a **second** terminal:

```powershell
cd C:\Users\<you>\Desktop\CyberGuard\frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

### Demo accounts (from sample data)

| Role  | Email                 | Password   |
| ----- | --------------------- | ---------- |
| Admin | admin@cyberguard.com  | Admin@123  |
| User  | ali@student.com       | User@1234  |
| User  | sara@student.com      | User@1234  |
| User  | usman@student.com     | User@1234  |

### Installation commands used to create the project (for reference)

```powershell
# frontend
npx create-next-app@latest frontend
cd frontend
npm install chart.js react-chartjs-2 jspdf jspdf-autotable lucide-react

# backend
mkdir backend; cd backend
npm init -y
npm install express mysql2 bcrypt jsonwebtoken cors helmet express-rate-limit express-validator dotenv
npm install -D nodemon
```

---

## 4. Detection rules

### URL engine (`backend/detection/urlAnalyzer.js`)
The URL is parsed as text only – **it is never opened or requested**. Only `http://` and `https://` addresses are accepted
(`javascript:`, `data:`, `file:` … are rejected).

| # | Check | Points |
|---|-------|--------|
| 1 | HTTPS availability – no HTTPS (+15) / no protocol given (+10). HTTPS present = 0 points with a note that **HTTPS ≠ safe** | 0–15 |
| 2 | IP address instead of a domain name | 25 |
| 3 | URL length > 75 (+8) / > 100 (+15) | 8–15 |
| 4 | Suspicious symbols: `@` (30), `//` in path (10), ≥2 hyphens in domain (10), heavy `%xx` encoding (8), punycode / non-ASCII (35), unusual port (10) | varies |
| 5 | Suspicious domain: ≥3 subdomain levels (12), high-abuse TLD like `.xyz .top .tk` (10), ≥4 digits in domain (8) | varies |
| 6 | URL shortening service (bit.ly, tinyurl…) | 30 |
| 7 | Suspicious keywords (login, verify, password, account…) – 6 each, max 20 | 6–20 |
| 8 | Domain impersonation – brand in a non-official domain (30), look-alike spelling e.g. `paypa1` (35), brand hidden before `@` (30), brand only in path (15) | 15–35 |

### Email engine (`backend/detection/emailAnalyzer.js`)

| Check | Points |
|-------|--------|
| Urgent / threatening language | 8 + 4 per extra phrase (max 25) |
| Fake account verification requests | 12 + 5 per extra (max 25) |
| Password / banking information requests | 12 + 6 per extra (max 30) |
| Suspicious links (each link analysed by the URL engine, never opened) | 15 (suspicious) / 25 (high risk), +5 if > 5 links |
| Unusual sender (optional field) – malformed, brand look-alike domain, display name ≠ domain, free email "company", random digits | 8–25 each |
| Prize / lottery / money scams | 20 + 5 per extra (max 35) |
| Advance-fee pattern (prize **and** money/fee/financial request) | 15 |
| Grammar & spelling – common misspellings, generic greeting, ALL CAPS, `!!!` | max 20 |
| Risky attachments / macro requests | 15 |

### Risk levels
Score is the sum of points, capped at 100: **0–29 SAFE**, **30–59 SUSPICIOUS**, **60–100 HIGH RISK**.

---

## 5. REST API

All responses are JSON. Protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET    | `/api/health` | public | API + DB status |
| POST   | `/api/auth/register` | public | `{name, email, password}` |
| POST   | `/api/auth/login` | public | `{email, password}` → token |
| POST   | `/api/auth/logout` | user | logs the logout |
| GET    | `/api/auth/me` | user | current user |
| PUT    | `/api/auth/profile` | user | `{name, email}` |
| PUT    | `/api/auth/password` | user | `{currentPassword, newPassword}` |
| POST   | `/api/scans/url` | user | `{url}` |
| POST   | `/api/scans/email` | user | `{content, sender?, subject?}` |
| GET    | `/api/history?type=all\|url\|email&level=` | user | own scan list |
| GET    | `/api/history/:type/:id` | user (admin: any) | full report |
| DELETE | `/api/history/:type/:id` | user | delete one scan |
| DELETE | `/api/history?type=all\|url\|email` | user | clear history |
| GET    | `/api/dashboard` | user | personal statistics |
| GET    | `/api/tips` | public | security tips |
| GET    | `/api/admin/stats` | admin | system statistics |
| GET    | `/api/admin/users` | admin | all users |
| PUT    | `/api/admin/users/:id/role` | admin | `{role: "user"\|"admin"}` |
| DELETE | `/api/admin/users/:id` | admin | delete user (+ their scans) |
| GET    | `/api/admin/scans?type=url\|email&level=` | admin | all scans |
| GET    | `/api/admin/logs?search=` | admin | activity logs |
| POST/PUT/DELETE | `/api/admin/tips[/:id]` | admin | manage tips |

---

## 6. Security measures implemented

- **Passwords** hashed with bcrypt (12 rounds); never returned by the API. Strong password policy enforced on both sides.
- **JWT** authentication (1-day expiry); the user and role are re-checked in the database on every request.
- **Authorization**: admin routes protected by `requireAdmin` on the server (the frontend guard is only for UX).
  Users can only read/delete their own scans. Admins cannot demote or delete themselves.
- **SQL injection**: every query uses `?` placeholders (parameterised queries). Table names are never taken from user input.
- **XSS**: React escapes all output; no `dangerouslySetInnerHTML`; names/tips are stripped of HTML tags on the server;
  `helmet` sets security headers. Submitted URLs are shown as plain text, never as clickable links.
- **Input validation** with express-validator (lengths, formats, enum values, numeric ids) + 100 kB body limit.
- **Rate limiting**: 500 requests / 15 min per IP, 20 login/register attempts / 15 min, 20 scans / minute.
- **Login enumeration protection**: same error message and similar timing for unknown email vs wrong password.
- **CORS** limited to the frontend origin. Secrets live in `.env` (git-ignored); error responses never leak stack traces.
- **Activity logging**: registrations, logins (including failed), scans, deletions and admin actions.

---

## 7. Sample test data

**URLs**

| URL | Expected |
|-----|----------|
| `https://www.google.com` | SAFE (0) |
| `https://bit.ly/3xYz12` | SUSPICIOUS (30) |
| `http://192.168.10.5/account/update.php` | SUSPICIOUS (52) |
| `https://xn--pple-43d.com` | SUSPICIOUS (35) |
| `https://amazon.com@evil.ru/` | HIGH RISK (60) |
| `http://paypa1.com/login/verify` | HIGH RISK (62) |
| `https://accounts.google.com.security-check.top/signin` | HIGH RISK (70) |
| `http://secure-paypal-login.verify-account.xyz/webscr?cmd=login` | HIGH RISK (75) |

**Emails** – use the **Load sample** buttons on the Email Scanner page (account phishing → HIGH RISK,
lottery scam → HIGH RISK, normal email → SAFE).

---

## 8. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Could not connect to MySQL` / `ECONNREFUSED` | Start MySQL in XAMPP. Check `DB_*` values in `backend/.env`. |
| `ER_ACCESS_DENIED_ERROR` | Wrong MySQL user/password in `.env`. |
| MySQL "Lost connection … reading initial communication packet" or XAMPP MySQL stops right after starting | The XAMPP data folder is probably corrupted after an improper shutdown. Stop MySQL, back up `C:\xampp\mysql\data`, then follow XAMPP's recovery guide (restore from `C:\xampp\mysql\backup`, keeping your own database folders and `ibdata1`). |
| Port 3306 already in use | Another MySQL service is running – stop it in *Services* or change `DB_PORT`. |
| Frontend shows "Cannot reach the CyberGuard server" | Start the backend (`npm run dev` in `backend`). |
| "Too many requests" | Rate limit reached – wait a few minutes or restart the backend during development. |
