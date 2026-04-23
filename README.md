# ชัวร์ก่อนแชร์ — Sure Before Share

**Thai fake news detector web app.** Analyzes text, URLs, and images for misinformation using AI and a curated database of trusted Thai and international sources.

> **MVP scope** — no authentication, no production deployment, runs locally via Docker Compose.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Scoring Logic](#scoring-logic)
- [Gemini AI Integration](#gemini-ai-integration)
- [Privacy Model](#privacy-model)
- [Seed Data](#seed-data)
- [Testing](#testing)
- [Scripts](#scripts)
- [UI Screens](#ui-screens)
- [i18n](#i18n)

---

## Features

### Multi-Format Analysis
- **Text** — paste up to 5,000 characters of a news claim
- **URL** — submit a news article URL; triggers both content and domain analysis
- **Image** — upload JPG/PNG/WEBP (max 10 MB) for AI-generated image detection

### Credibility Scoring

Results show a 0–100 score mapped to one of five verdict levels:

| Level | Thai | Score Range | Color |
|---|---|---|---|
| DANGEROUS | อันตราย | 0–20% | Red `#DC2626` |
| SUSPICIOUS | น่าสงสัย | 21–40% | Orange `#D97706` |
| UNCERTAIN | ไม่แน่ใจ | 41–60% | Yellow `#CA8A04` |
| LIKELY_TRUE | ค่อนข้างจริง | 61–80% | Lime `#65A30D` |
| VERIFIED | ยืนยันแล้ว | 81–100% | Green `#059669` |

A 5-segment progress bar highlights the current verdict. Separate AI confidence percentage shown; warning displayed if confidence < 60%.

### Evidence Breakdown
Three stat cards show the percentage of references that are Supporting / Opposing / Neutral, with total source counts.

### AI Image Detection (Gemini)
- Sends image to `gemini-2.5-flash` for forensic analysis
- Returns: AI probability (0–100%), detected model (Midjourney / DALL-E / Stable Diffusion / unknown), Thai reasoning bullets
- EXIF metadata analysis (presence, dimensions, suspicious signals)
- Reverse image search — **MVP: mock data with clear label**

### Source & Domain Analysis
For URL submissions, automatically analyzes:
- Domain age (days), SSL status, WHOIS privacy, known phishing status
- Risk levels: ปลอดภัย / น่าสงสัย / อันตราย
- Social account analysis — **MVP: mock data with clear label**

### Thai Reasoning Bullets
Result page shows 3–7 accordion bullet points in Thai explaining the verdict, each prefixed with ⚠ / ! / ?.

### Reference List
Shows all sources used, each with:
- Source name + type badge (FACT_CHECKER / TRUSTED_MEDIA / GOV / ACADEMIC)
- Stance badge (ยืนยัน / คัดค้าน / เป็นกลาง)
- Excerpt, publish date, credibility mini-bar
- Sortable by credibility, date, or stance

### Trending Searches
`/trending` page shows top 20 most-checked queries (today / this week / this month), with check count and verdict badge. Data is anonymized — only hashed queries and verdicts stored.

### Local History
`/history` page reads from `localStorage`. Supports search, verdict filter, date range filter. Export/import as JSON. Max 100 entries. No history data sent to server.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Docker Compose                 │
│                                             │
│  ┌─────────────────┐   ┌─────────────────┐  │
│  │   app (Next.js) │   │  db (PostgreSQL) │  │
│  │   Port 3000     │◄──►  Port 5432       │  │
│  └────────┬────────┘   └─────────────────┘  │
│           │                                 │
└───────────┼─────────────────────────────────┘
            │ HTTPS
            ▼
   Google Gemini API
   model: gemini-2.5-flash
```

Two Docker services: `app` (Next.js 14, Node 20 Alpine) and `db` (PostgreSQL 15 Alpine). Single external dependency: Google Gemini API, used only for image analysis. All text/URL analysis runs in-process using DB lookups and in-memory scoring — no other external API calls in MVP.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 14 |
| Language | TypeScript (strict mode) | 5.x |
| Styling | TailwindCSS + shadcn/ui | 4.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15 |
| State | Zustand | 5.x |
| Data fetching | TanStack Query (React Query) | 5.x |
| Validation | Zod | 4.x |
| i18n | next-intl | 4.x |
| AI | Google Gemini API (`@google/genai`) | latest |
| EXIF parsing | exifr | 7.x |
| Testing | Vitest + jsdom | 4.x |
| Dates | date-fns | 4.x |

---

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Google Gemini API key ([get one here](https://aistudio.google.com))

### Option A — Full Docker (recommended)

```bash
git clone https://github.com/jidapa-tx/fake-news.git
cd fake-news

# Set your Gemini key
export GEMINI_API_KEY=your_key_here

# Start everything (app + DB, auto-migrates + seeds)
docker compose up
```

App available at `http://localhost:3000`.

### Option B — Dev Mode

```bash
# 1. Start only the database
docker compose up db -d

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in DATABASE_URL and GEMINI_API_KEY

# 4. Apply migrations and seed data
npm run db:migrate
npm run db:seed

# 5. Start dev server
npm run dev
```

App available at `http://localhost:3000` with hot reload.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `NEXT_PUBLIC_APP_URL` | No | App base URL (default: `http://localhost:3000`) |
| `NODE_ENV` | No | `development` or `production` |

**Example `.env.local`:**

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fakenews"
GEMINI_API_KEY="your-gemini-api-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

> API keys must only appear in server-side env vars — never in `NEXT_PUBLIC_*` vars.

---

## Project Structure

```
/
├── app/
│   ├── layout.tsx                  # Root layout — header, privacy banner, providers
│   ├── page.tsx                    # Home — input card + recent checks
│   ├── result/[id]/page.tsx        # Result detail page
│   ├── trending/page.tsx           # Trending list page
│   ├── history/page.tsx            # Local history (client component, localStorage)
│   └── api/
│       ├── analyze/
│       │   ├── text/route.ts       # POST /api/analyze/text
│       │   ├── image/route.ts      # POST /api/analyze/image
│       │   └── source/route.ts     # POST /api/analyze/source
│       ├── trending/route.ts       # GET /api/trending
│       ├── references/
│       │   └── [analysisId]/route.ts  # GET /api/references/:analysisId
│       └── health/route.ts         # GET /api/health
│
├── components/
│   ├── Header.tsx                  # Nav + language toggle
│   ├── PrivacyBanner.tsx           # Sticky "data stored locally only" banner
│   ├── VerdictBadge.tsx            # Colored verdict pill
│   └── Providers.tsx               # TanStack Query + Zustand providers
│
├── services/
│   ├── text-analyzer.ts            # Credibility scoring logic
│   ├── image-analyzer.ts           # Gemini response parsing + EXIF extraction
│   └── source-analyzer.ts          # Domain risk assessment
│
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── gemini.ts                   # Gemini client + analyzeImage()
│   ├── rate-limit.ts               # Sliding window rate limiter (30 req/min per IP)
│   ├── hash.ts                     # SHA-256 query normalization + hashing
│   └── errors.ts                   # ApiError class + formatError()
│
├── hooks/
│   └── useLocalHistory.ts          # localStorage CRUD for HistoryItem[]
│
├── messages/
│   ├── th.json                     # Thai translations (default locale)
│   └── en.json                     # English translations
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # 22+ trusted sources, 11+ fake claims, 11+ suspicious domains
│
├── types/
│   └── index.ts                    # Shared TypeScript types and enums
│
├── tests/
│   ├── text-analyzer.test.ts
│   ├── image-analyzer.test.ts
│   ├── source-analyzer.test.ts
│   ├── useLocalHistory.test.ts
│   ├── api-validation.test.ts
│   └── setup.ts
│
├── i18n/request.ts                 # next-intl config
├── docker-compose.yml
├── Dockerfile
└── vitest.config.ts
```

---

## API Reference

All API routes:
- Rate-limited: **30 requests/minute per IP**
- Error format: `{ "error": { "code": string, "message_th": string, "message_en": string } }`
- Never return raw stack traces

### Error Codes

| Code | HTTP | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema validation failed |
| `TEXT_TOO_LONG` | 400 | Input exceeds 5,000 characters |
| `INVALID_URL` | 400 | URL format is invalid |
| `FILE_TOO_LARGE` | 400 | Image exceeds 10 MB |
| `UNSUPPORTED_TYPE` | 400 | File type not JPG/PNG/WEBP |
| `RATE_LIMITED` | 429 | More than 30 requests/minute from this IP |
| `GEMINI_ERROR` | 502 | Gemini API call failed |
| `NOT_FOUND` | 404 | Analysis ID not found |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

### `POST /api/analyze/text`

Analyzes text or URL content for misinformation.

**Request body:**
```json
{
  "query": "ข้อความหรือ URL ที่ต้องการตรวจสอบ",
  "queryType": "text" | "url"
}
```

Constraints: `query` min 10 chars, max 5,000 chars.

**Response 200:**
```typescript
{
  analysisId: string,
  verdict: "DANGEROUS" | "SUSPICIOUS" | "UNCERTAIN" | "LIKELY_TRUE" | "VERIFIED",
  score: number,           // 0–100
  confidence: number,      // 0–100 AI confidence
  reasoning: string[],     // 3–7 Thai bullet points
  references: Reference[],
  sourceAnalysis?: SourceAnalysis,  // present when queryType === 'url'
  cachedAt?: string        // ISO 8601 if result was cached
}
```

**Processing logic:**
1. Hash + normalize query; check `KnownFakeClaim` table — if matched, return cached verdict (confidence 99)
2. Match domains against `TrustedSource` table
3. Score using: claim match weight, source credibility, stance distribution
4. Save `Analysis` + `Reference[]` rows to DB
5. Upsert `TrendingEntry` (increment count for this query hash)

---

### `POST /api/analyze/image`

Analyzes an image for AI generation and visual misinformation.

**Request:** `multipart/form-data`, field `image` — JPG/PNG/WEBP, max 10 MB.

**Response 200:**
```typescript
{
  analysisId: string,
  verdict: VerdictLevel,
  score: number,
  confidence: number,
  aiDetection: {
    aiProbability: number,      // 0–100
    detectedModel: string,      // 'Midjourney' | 'DALL-E' | 'Stable Diffusion' | 'unknown'
    reasoning: string[]         // Thai reasoning bullets from Gemini
  },
  metadata: {
    hasExif: boolean,
    dimensions: { width: number, height: number } | null,
    fileFormat: string,
    fileSizeKb: number,
    suspiciousSignals: string[] // Thai
  },
  reverseImageSearch: {         // MVP: mock data
    isMock: true,
    firstSeenAt: string | null,
    appearances: number,
    topUrls: string[]
  }
}
```

---

### `POST /api/analyze/source`

Analyzes a URL's domain credibility.

**Request body:** `{ "url": "https://example.com" }`

**Response 200:**
```typescript
{
  domain: string,
  domainAgeDays: number | null,
  sslStatus: "valid" | "invalid" | "none",
  whoisPrivacy: boolean,
  isKnownPhishing: boolean,
  riskLevel: "safe" | "suspicious" | "dangerous",
  riskReasonsTh: string[],
  socialAccountAnalysis: {      // MVP: mock data
    isMock: true,
    accountAge: string,
    postFrequency: string,
    followerRatio: number,
    coordinatedBehavior: boolean,
    coordinatedCount: number | null
  } | null
}
```

**Risk level logic:**
- `dangerous` — in `SuspiciousDomain` table, OR domain age < 30 days AND no SSL
- `suspicious` — domain age < 180 days, OR WHOIS privacy enabled, OR no SSL
- `safe` — matches a `TrustedSource` domain, OR all checks pass

---

### `GET /api/trending`

Returns the top 20 most-checked queries.

**Query params:** `period=day|week|month` (default: `day`)

**Response 200:**
```typescript
{
  period: "day" | "week" | "month",
  updatedAt: string,
  items: [{
    rank: number,
    queryPreview: string,   // first 80 chars
    checkCount: number,
    changePercent: number,  // vs previous period
    lastVerdict: VerdictLevel,
    analysisId: string,
    lastCheckedAt: string
  }]
}
```

---

### `GET /api/references/:analysisId`

Returns the reference list for a saved analysis.

**Response 200:** `Reference[]`
**Response 404:** `ApiError` with code `NOT_FOUND`

---

### `GET /api/health`

```json
{ "status": "ok", "db": "connected", "timestamp": "2026-04-23T00:00:00.000Z" }
```

---

## Database Schema

Six models in PostgreSQL via Prisma:

```
Analysis          — each check run; stores query, verdict, score, reasoning
Reference         — sources found for an analysis (cascade deletes with Analysis)
TrustedSource     — pre-seeded reputable news/fact-check outlets
KnownFakeClaim    — pre-seeded known false claims (hash-indexed for fast lookup)
SuspiciousDomain  — pre-seeded flagged domains
TrendingEntry     — aggregated check counts per query hash + period
```

**Key design notes:**
- `Analysis.queryHash` — SHA-256 of lowercased, whitespace-normalized query; used for deduplication and trending aggregation
- `TrendingEntry` unique constraint on `(queryHash, period)`; upserted on every analysis
- `Reference` cascades delete when parent `Analysis` is deleted
- Indexes on `queryHash`, `createdAt`, `(period, count)`

**ERD:**
```
Analysis ||--o{ Reference      : has
Analysis ||--o{ TrendingEntry  : tracked by
```

### localStorage Schema

History is stored client-side only, never sent to the server.

| Key | Type | Max | Eviction |
|---|---|---|---|
| `snbs_history` | `HistoryItem[]` | 100 items | Oldest by `createdAt` |
| `snbs_lang` | `'th' \| 'en'` | 1 value | Manual |

**`HistoryItem` structure:**
```typescript
{
  id: string,            // nanoid()
  queryType: 'text' | 'url' | 'image',
  queryPreview: string,  // truncated to 100 chars
  query: string,         // full query or filename
  verdict: VerdictLevel,
  score: number,
  confidence: number,
  analysisId: string,    // links to server-side Analysis.id
  createdAt: string      // ISO 8601
}
```

**Export format** (`snbs-history.json`):
```json
{ "version": "1.0", "exported_at": "ISO date", "items": [...] }
```
Import merges by `id` (no duplicates), enforces 100-entry limit.

---

## Scoring Logic

Implemented in `services/text-analyzer.ts`:

```
score = base_score + modifiers

Base score:
  Known fake claim match (queryHash)  → score = 5  (will be DANGEROUS/SUSPICIOUS)
  No match                            → score = 50 (neutral start)

Modifiers:
  TRUSTED_MEDIA/FACT_CHECKER source opposing    → −8 each  (floor: 0)
  TRUSTED_MEDIA/FACT_CHECKER source supporting  → +8 each  (ceiling: 100)
  Suspicious domain detected                    → −25
  Known fake claim partial match (>80% similar) → −20
  AI confidence < 60%                           → no score penalty; warning shown in UI

Final verdict = scoreToVerdict(score)
```

---

## Gemini AI Integration

Implemented in `lib/gemini.ts` and `services/image-analyzer.ts`.

**Model:** `gemini-2.5-flash`

**Prompt template sent with image:**
```
You are an expert forensic image analyst. Analyze the provided image and determine
if it was generated by AI.

Respond ONLY in valid JSON with this exact structure:
{
  "aiProbability": <number 0-100>,
  "detectedModel": "<Midjourney|DALL-E|Stable Diffusion|unknown>",
  "reasoning": ["<Thai bullet 1>", ...],
  "confidence": <number 0-100>
}

Analysis criteria:
- Check for unnatural textures, lighting inconsistencies, warped text/hands/fingers
- Look for AI generation artifacts (halos, blending errors, symmetry anomalies)
- Examine background coherence and depth consistency
- All reasoning must be in Thai language
- If unsure, set aiProbability to 50 and confidence to 40
```

**Graceful fallback** — if Gemini call fails (network error, invalid JSON, API error):
- Returns `aiProbability: 50, detectedModel: 'unknown', reasoning: ['ไม่สามารถวิเคราะห์ได้ในขณะนี้'], confidence: 0`
- Logs error server-side
- Endpoint always returns HTTP 200 with fallback data — never throws to client

---

## Privacy Model

| Data | Where stored | Notes |
|---|---|---|
| Check history | Browser `localStorage` only | Never transmitted to server |
| Trending counts | PostgreSQL | Query text is SHA-256 hashed; raw text not stored |
| IP addresses | Not stored | Used only for in-memory rate limiting; never persisted |
| User agents | Not stored | — |

Privacy banner shown on every page: `🔒 ข้อมูลเก็บในเครื่องคุณเท่านั้น ไม่ส่งไป server`

CORS is restricted to `localhost` origins only (MVP). No cookies, no sessions, no authentication.

---

## Seed Data

Run with `npm run db:seed`. Auto-runs inside Docker on startup.

### Trusted Sources (22 entries)

**Thai:**

| Name | Domain | Type | Credibility |
|---|---|---|---|
| ไทยรัฐ | thairath.co.th | TRUSTED_MEDIA | 80 |
| มติชน | matichon.co.th | TRUSTED_MEDIA | 82 |
| ไทยพีบีเอส | thaipbs.or.th | TRUSTED_MEDIA | 90 |
| AFP Fact Check TH | factcheck.afp.com/th | FACT_CHECKER | 95 |
| ศูนย์ต่อต้านข่าวปลอม | antifakenewscenter.com | GOV | 88 |
| Cofact Thailand | cofact.org | FACT_CHECKER | 83 |
| Sure And Share | sure.co.th | FACT_CHECKER | 85 |
| BBC Thai | bbc.com/thai | TRUSTED_MEDIA | 95 |

**International:**

| Name | Domain | Type | Credibility |
|---|---|---|---|
| BBC | bbc.com | TRUSTED_MEDIA | 97 |
| Reuters | reuters.com | TRUSTED_MEDIA | 97 |
| AP News | apnews.com | TRUSTED_MEDIA | 96 |
| Snopes | snopes.com | FACT_CHECKER | 92 |
| FactCheck.org | factcheck.org | FACT_CHECKER | 94 |
| PolitiFact | politifact.com | FACT_CHECKER | 90 |
| WHO | who.int | GOV | 93 |

### Known Fake Claims (11 entries, sample)

| Claim | Verdict |
|---|---|
| ดื่มน้ำร้อนฆ่าไวรัสโคโรนาได้ | DANGEROUS |
| วัคซีนโควิดมีชิปติดตาม 5G | DANGEROUS |
| บิล เกตส์ปล่อยโควิดเพื่อขายวัคซีน | DANGEROUS |
| กินกระเทียมป้องกันโควิดได้ | SUSPICIOUS |
| แอลกอฮอล์ฉีดเข้าเส้นฆ่าโควิดได้ | DANGEROUS |

### Suspicious Domains (11 entries, sample)

| Domain | Risk | Reason |
|---|---|---|
| news-fake-th.com | high | ไม่มีการลงทะเบียนสื่อ ข้อมูล WHOIS ซ่อน |
| thairath-news.net | high | ปลอมแปลงชื่อใกล้เคียงสื่อจริง |
| covid-cure-thai.com | high | เว็บไซต์รักษาโรคปลอม |

---

## Testing

```bash
npm test            # run all tests (Vitest)
npm run test:watch  # watch mode
```

**Unit test coverage:**

| File | Min Tests |
|---|---|
| `services/text-analyzer.ts` | 5 |
| `services/image-analyzer.ts` | 5 |
| `services/source-analyzer.ts` | 5 |
| `hooks/useLocalHistory.ts` | 5 |
| API Zod validation | 5 |

**Mock strategy:** `vi.mock('../lib/prisma')` + `vi.mock('../lib/gemini')` in all service tests. Test environment: `jsdom`.

---

## Scripts

```bash
npm run dev          # start Next.js dev server (hot reload)
npm run build        # production build
npm run start        # start production server
npm test             # run all Vitest unit tests
npm run test:watch   # Vitest in watch mode
npm run lint         # ESLint
npm run db:generate  # regenerate Prisma client
npm run db:migrate   # run Prisma migrations (dev)
npm run db:seed      # seed trusted sources, fake claims, suspicious domains
npm run db:studio    # open Prisma Studio (DB GUI at localhost:5555)
```

---

## UI Screens

### Home (`/`)
- Blue gradient hero with `"ตรวจสอบข่าวก่อนส่งต่อ"` heading
- Input card with 3 tabs: 📝 ข้อความ / 🔗 URL / 🖼 รูปภาพ
- Image upload with drag-and-drop support
- Stats row (total checks, % suspicious, trusted source count)
- Recent 3 checks from localStorage

### Result (`/result/[id]`)
- Score circle (0–100) + 5-segment color bar
- Evidence stat cards (supporting / opposing / neutral)
- Accordion reasoning bullets (Thai)
- Sortable reference list with stance badges and credibility bars
- Domain analysis grid (URL submissions only)
- Action bar: re-verify, copy result, share

### History (`/history`)
- Filter by verdict, date range, full-text search
- Export JSON / Import JSON
- Individual delete (trash icon on hover) + "Delete all" with confirmation modal
- Max 100 entries, oldest auto-removed

### Trending (`/trending`)
- Period tabs: วันนี้ / สัปดาห์นี้ / เดือนนี้
- Top 10 + Top 11–20 sections
- Rank medals for top 3 (🥇🥈🥉)
- Trend delta indicators (▲/▼)
- Privacy notice: `"ข้อมูลเป็นสถิติรวม ไม่มีการเก็บข้อมูลผู้ใช้"`

---

## i18n

Default locale: Thai (`th`). Supported: `th`, `en`.

- Translation files: `messages/th.json`, `messages/en.json`
- Language persisted in `localStorage` key `snbs_lang`
- All verdict labels, stance badges, error messages, nav, and the privacy banner are translated
- Font: IBM Plex Sans Thai (400/500/600)

---

## Docs

| File | Contents |
|---|---|
| [`docs/requirement.md`](docs/requirement.md) | Functional requirements FR.1–FR.7 with acceptance criteria |
| [`docs/data-schema.md`](docs/data-schema.md) | Full Prisma schema, ERD, seed data, localStorage schema |
| [`docs/technical-spec.md`](docs/technical-spec.md) | Architecture, API contracts, scoring logic, Gemini prompt, security |
| [`docs/ui-requirement.md`](docs/ui-requirement.md) | Screen-by-screen UX reference, design tokens, breakpoints |

---

## License

ISC — see [package.json](package.json)
