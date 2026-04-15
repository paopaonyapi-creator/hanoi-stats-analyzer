# Hanoi Stats Analyzer

> เครื่องมือวิเคราะห์ข้อมูลย้อนหลังเชิงสถิติสำหรับฮานอยพิเศษ ฮานอยปกติ และฮานอยวีไอพี

![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Production-336791?logo=postgresql)
![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway)

---

## ⚠️ Disclaimer

**ระบบนี้เป็นเครื่องมือวิเคราะห์ข้อมูลย้อนหลังเชิงสถิติเท่านั้น ไม่ใช่การรับประกันผล และไม่ควรตีความว่าเป็นคำแนะนำในการเล่นพนัน**

---

## Features

- **Dashboard** — ภาพรวมสถิติข้อมูลทั้งหมดพร้อมกราฟ
- **Truth Engine** — ระบบประเมินและเช็คความจริงของสมมติฐาน ผ่าน 6 ขั้นตอน (Integrity, Features, Signals, Scoring, Backtest, Drift) ป้องกัน Overclaim
- **ผลย้อนหลัง** — ตาราง data table พร้อม search, filter, sort, pagination
- **รายละเอียด record** — ข้อมูลเต็มของแต่ละงวด + analysis tags
- **นำเข้าข้อมูล (CSV Import)** — drag & drop, preview, validate, auto-skip duplicates
- **วิเคราะห์สถิติ** — ความถี่, gap analysis, transitions, odd/even, weekday distribution
- **Trend Score** — คะแนนแนวโน้มเชิงสถิติ 00-99 พร้อม heatmap + evidence breakdown
- **ตั้งค่า** — ปรับ score weights, export data, reset database
- **Export** — CSV / JSON
- **Railway-Ready** — standalone output พร้อม deploy ทันที

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod |
| Date | date-fns |
| CSV Parser | PapaParse |
| Icons | Lucide React |
| Deploy | Railway |

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Data models
│   └── seed.ts                # Seed data (120+ records)
├── public/
│   └── samples/
│       └── hanoi-sample.csv   # Sample CSV for testing
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Dashboard
│   │   ├── globals.css
│   │   ├── results/
│   │   │   ├── page.tsx       # Results table
│   │   │   └── [id]/page.tsx  # Result detail
│   │   ├── import/page.tsx    # CSV import
│   │   ├── analysis/page.tsx  # Analysis
│   │   ├── trend-score/page.tsx
│   │   ├── settings/page.tsx
│   │   └── api/
│   │       ├── import/route.ts
│   │       ├── results/route.ts
│   │       ├── results/[id]/route.ts
│   │       ├── analysis/summary/route.ts
│   │       ├── trend-score/route.ts
│   │       ├── settings/route.ts
│   │       ├── export/csv/route.ts
│   │       └── export/json/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-shell.tsx
│   │   │   └── page-header.tsx
│   │   └── common/
│   │       ├── stat-card.tsx
│   │       ├── chart-card.tsx
│   │       ├── disclaimer-banner.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-state.tsx
│   │       └── confirm-dialog.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── csv/
│   │   │   ├── parse.ts
│   │   │   └── normalize.ts
│   │   ├── stats/
│   │   │   ├── analysis.ts
│   │   │   ├── gap.ts
│   │   │   ├── transitions.ts
│   │   │   └── windows.ts
│   │   ├── scoring/
│   │   │   ├── score.ts
│   │   │   ├── explain.ts
│   │   │   └── defaults.ts
│   │   └── validation/
│   │       ├── import.ts
│   │       └── filters.ts
│   └── types/
│       └── index.ts
├── __tests__/                 # Test scaffolding
├── .env.example
├── next.config.ts
├── package.json
├── prisma.config.ts
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+ (recommended: 20+)
- PostgreSQL database (local or remote)
- npm

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd hanoi-stats-analyzer
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hanoi_stats?schema=public"
```

### 3. Database Migration

```bash
npx prisma migrate dev --name init
```

This creates the database tables from the Prisma schema.

### 4. Seed Data

```bash
npm run db:seed
```

Seeds the database with 120+ sample records so the dashboard shows data immediately.

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 6. (Optional) Prisma Studio

```bash
npm run db:studio
```

Opens a browser GUI to inspect/edit database records directly.

---

## CSV Import Format

### Required Fields

| Field | Description | Example |
|-------|------------|---------|
| date | Draw date | `2025-03-01` |
| type | Draw type | `SPECIAL`, `NORMAL`, `VIP` |
| time | Draw time (optional) | `17:05` |
| result | Result number | `48273` |

### Supported Field Aliases

- `date` → `draw_date`, `drawdate`, `วันที่`
- `type` → `draw_type`, `drawtype`, `ประเภท`
- `time` → `draw_time`, `drawtime`, `เวลา`
- `result` → `number`, `value`, `result5`, `ผล`, `เลข`

### Type Aliases

- **SPECIAL**: `special`, `ฮานอยพิเศษ`, `พิเศษ`
- **NORMAL**: `normal`, `ฮานอยปกติ`, `ปกติ`, `hanoi`
- **VIP**: `vip`, `ฮานอยวีไอพี`, `วีไอพี`

### Date Formats

`yyyy-MM-dd`, `dd/MM/yyyy`, `d/M/yyyy`, `dd-MM-yyyy`, `yyyy/MM/dd`, ISO 8601

### Example CSV

```csv
date,type,time,result
2025-03-01,SPECIAL,17:05,48273
2025-03-01,NORMAL,18:10,91652
2025-03-01,VIP,19:15,37491
```

A sample file is available at `/public/samples/hanoi-sample.csv` and can be downloaded from the Import page.

---

## Scoring System

### Statistical Trend Score

The Trend Score is a **deterministic statistical analysis** — it is **NOT a prediction**. It analyzes historical data patterns to produce a score from 0 to 100 for each 2-digit number (00-99).

### Score Formula

```
score = w1 × frequency_all_time
      + w2 × frequency_recent
      + w3 × gap_factor
      + w4 × transition_factor
      + w5 × digit_balance_factor
      + w6 × repeat_behavior_factor
      + w7 × weekday_alignment_factor
```

### Default Weights

| Factor | Weight | Description |
|--------|--------|-------------|
| All-Time Frequency | 1.0 | How often the number has appeared overall |
| Recent Frequency | 1.5 | How often it appeared in the rolling window |
| Gap Factor | 1.2 | How long since it last appeared |
| Transition Factor | 1.0 | Likelihood of following the previous number |
| Digit Balance | 0.8 | Balance between tens and units digits |
| Repeat Behavior | 1.0 | Patterns of consecutive appearances |
| Weekday Alignment | 0.7 | Frequency on the current weekday |

All weights are configurable via the Settings page.

---

## Railway Deployment (Step-by-Step)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Hanoi Stats Analyzer"
git remote add origin https://github.com/YOUR_USER/hanoi-stats-analyzer.git
git push -u origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `hanoi-stats-analyzer` repository
5. Railway will auto-detect it as a Node.js project

### Step 3: Add PostgreSQL Service

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will provision a PostgreSQL instance

### Step 4: Connect Database to App

1. Click on your **app service** (not the database)
2. Go to **"Variables"** tab
3. Click **"Add Variable Reference"**
4. Select the `DATABASE_URL` from your PostgreSQL service
5. Railway will auto-inject it as an environment variable

### Step 5: Set Pre-Deploy Command

1. In your app service, go to **"Settings"**
2. Under **"Deploy"**, set **Pre-deploy Command**:
   ```
   npx prisma migrate deploy
   ```
3. This runs migrations automatically before each deploy

### Step 6: Set Additional Environment Variables

Add these in the **Variables** tab:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_NAME` | `Hanoi Stats Analyzer` |
| `PORT` | `3000` |

### Step 7: Deploy

1. Railway auto-deploys on each push to your GitHub repo
2. First deploy may take 2-5 minutes
3. Monitor the **"Deployments"** tab for build logs

### Step 8: Access Your App

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** to get a public URL
3. Your app is now live at `https://your-app.up.railway.app`

### Step 9: Seed Data (Optional)

After the first deploy, you can seed data by:

**Option A**: Use the Import page to upload a CSV file  
**Option B**: Run seed locally against the production database (caution!):
```bash
DATABASE_URL="<railway-postgres-url>" npm run db:seed
```

### Step 10: Troubleshooting

- Check **"Deployments"** → latest deployment → **"Build Logs"**
- Check **"Deployments"** → latest deployment → **"Deploy Logs"**
- Ensure `DATABASE_URL` is correctly set
- Ensure migrations ran successfully in pre-deploy

### Future Migrations

When you update `prisma/schema.prisma`:

```bash
# Locally
npx prisma migrate dev --name your_migration_name

# Push to GitHub — Railway auto-runs:
#   npx prisma migrate deploy
```

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/results` | Paginated results with filters |
| GET | `/api/results/[id]` | Single result with prev/next |
| POST | `/api/import` | Import CSV rows |
| GET | `/api/analysis/summary` | Full analysis summary |
| GET | `/api/trend-score` | Trend scores for 00-99 |
| GET/PUT | `/api/settings` | App settings CRUD |
| DELETE | `/api/settings?action=reset-db` | Reset database |
| GET | `/api/export/csv` | Export all data as CSV |
| GET | `/api/export/json` | Export all data as JSON |

---

## Important Notes

- **Production database**: Always use PostgreSQL. SQLite is NOT supported for production.
- **Standalone output**: `next.config.ts` uses `output: "standalone"` for Railway compatibility.
- **No gambling claims**: This tool provides statistical analysis only. It does not guarantee outcomes.

---

## Future Improvements

- [ ] Real-time data scraping integration
- [ ] Telegram bot notifications
- [ ] Advanced pattern recognition (machine learning)
- [ ] User authentication / multi-tenant
- [ ] Data backup / restore
- [ ] More chart types (scatter, radar)
- [ ] Comparison mode between draw types
- [ ] Mobile app (React Native / PWA)
- [ ] Cron job for automatic data collection
- [ ] WebSocket for live updates

---

## License

MIT — For educational and statistical analysis purposes only.
