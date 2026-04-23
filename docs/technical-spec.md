# Technical Specification — ชัวร์ก่อนแชร์

Single source of truth for all developers. Derived from `docs/requirement.md`, `docs/data-schema.md`, and `ui-prototypes/`.

---

## 1. Architecture Overview

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
   Google Gemini API (external)
   model: gemini-2.5-flash
```

### Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `app` | node:20-alpine (custom Dockerfile) | 3000 | Next.js 14 App Router |
| `db` | postgres:15-alpine | 5432 | Primary database |

### Single External Dependency
- **Google Gemini API** — used only for image AI-detection (`/api/analyze/image`)
- All other analysis uses in-memory scoring + DB lookups (no other external APIs in MVP)

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 14+ |
| Language | TypeScript | 5.x (strict mode) |
| Styling | TailwindCSS + shadcn/ui | 3.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15 |
| State | Zustand | 4.x |
| Data fetching | TanStack Query (React Query) | 5.x |
| Validation | Zod | 3.x |
| i18n | next-intl | 3.x |
| AI | Google Gemini API (`@google/generative-ai`) | latest |
| EXIF | exifr | latest |
| Rate limiting | `@upstash/ratelimit` or custom in-memory | — |
| Testing | Vitest + jsdom | latest |
| E2E | Playwright | latest |

---

## 3. Project Structure

```
/
├── app/
│   ├── layout.tsx                  # Root layout (header, privacy banner, providers)
│   ├── page.tsx                    # Home — input card + recent checks
│   ├── result/[id]/
│   │   └── page.tsx                # Result detail page
│   ├── trending/
│   │   └── page.tsx                # Trending list page
│   ├── history/
│   │   └── page.tsx                # Local history page (client component)
│   └── api/
│       ├── analyze/
│       │   ├── text/route.ts       # POST /api/analyze/text
│       │   ├── image/route.ts      # POST /api/analyze/image
│       │   └── source/route.ts     # POST /api/analyze/source
│       ├── trending/route.ts       # GET /api/trending
│       ├── references/
│       │   └── [analysisId]/route.ts  # GET /api/references/:analysisId
│       └── health/route.ts         # GET /api/health
├── components/
│   ├── Header.tsx
│   ├── PrivacyBanner.tsx
│   ├── InputCard.tsx               # Tab switcher + text/url/image inputs
│   ├── ImageUpload.tsx             # Drag-drop image upload
│   ├── VerdictCard.tsx             # Score circle + 5-segment bar
│   ├── EvidenceStats.tsx           # 3 stat cards
│   ├── ReasoningList.tsx           # Accordion bullets
│   ├── ReferenceList.tsx           # Sortable reference cards
│   ├── SourceAnalysis.tsx          # Domain info grid
│   ├── TrendingList.tsx
│   └── HistoryList.tsx
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── gemini.ts                   # Gemini client + analyzeImageForAI()
│   ├── rate-limit.ts               # Rate limiter (30 req/min per IP)
│   ├── hash.ts                     # SHA-256 query hashing
│   └── errors.ts                   # ApiError class + formatError()
├── services/
│   ├── text-analyzer.ts            # Credibility scoring logic
│   ├── image-analyzer.ts           # Gemini response parsing + EXIF
│   └── source-analyzer.ts          # Domain risk assessment
├── hooks/
│   └── useLocalHistory.ts          # localStorage CRUD for HistoryItem[]
├── messages/
│   ├── th.json                     # Thai translations (default)
│   └── en.json                     # English translations
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                     # 20+ sources, 10+ fake claims, 10+ domains
├── types/
│   └── index.ts                    # Shared TypeScript types + enums
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── vitest.config.ts
```

---

## 4. Shared TypeScript Types & Enums

```typescript
// types/index.ts

export enum VerdictLevel {
  DANGEROUS = 'DANGEROUS',     // 0-20
  SUSPICIOUS = 'SUSPICIOUS',   // 21-40
  UNCERTAIN = 'UNCERTAIN',     // 41-60
  LIKELY_TRUE = 'LIKELY_TRUE', // 61-80
  VERIFIED = 'VERIFIED',       // 81-100
}

export enum Stance {
  SUPPORTING = 'SUPPORTING',
  OPPOSING = 'OPPOSING',
  NEUTRAL = 'NEUTRAL',
}

export enum SourceType {
  TRUSTED_MEDIA = 'TRUSTED_MEDIA',
  FACT_CHECKER = 'FACT_CHECKER',
  ACADEMIC = 'ACADEMIC',
  GOV = 'GOV',
  UNKNOWN = 'UNKNOWN',
}

export function scoreToVerdict(score: number): VerdictLevel {
  if (score <= 20) return VerdictLevel.DANGEROUS;
  if (score <= 40) return VerdictLevel.SUSPICIOUS;
  if (score <= 60) return VerdictLevel.UNCERTAIN;
  if (score <= 80) return VerdictLevel.LIKELY_TRUE;
  return VerdictLevel.VERIFIED;
}

export interface ApiError {
  error: {
    code: string;
    message_th: string;
    message_en: string;
  };
}

// localStorage types
export interface HistoryItem {
  id: string;
  queryType: 'text' | 'url' | 'image';
  queryPreview: string;   // truncated to 100 chars
  query: string;
  verdict: VerdictLevel;
  score: number;
  confidence: number;
  analysisId: string;
  createdAt: string;      // ISO 8601
}

export interface HistoryExport {
  version: '1.0';
  exported_at: string;
  items: HistoryItem[];
}
```

---

## 5. Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://postgres:postgres@db:5432/fakenews"

# Google Gemini
GEMINI_API_KEY="your-gemini-api-key-here"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 6. API Contracts

### Error Format (ALL endpoints)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message_th": "ข้อมูลที่ส่งมาไม่ถูกต้อง",
    "message_en": "Invalid input data"
  }
}
```
**Never return raw stack traces or unformatted error objects.**

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Zod schema failed |
| `TEXT_TOO_LONG` | 400 | > 5000 chars |
| `INVALID_URL` | 400 | URL format invalid |
| `FILE_TOO_LARGE` | 400 | Image > 10 MB |
| `UNSUPPORTED_TYPE` | 400 | Not JPG/PNG/WEBP |
| `RATE_LIMITED` | 429 | > 30 req/min |
| `GEMINI_ERROR` | 502 | Gemini API failure |
| `NOT_FOUND` | 404 | Analysis not found |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

### POST `/api/analyze/text`

**Request**
```typescript
// Zod schema
const TextAnalyzeSchema = z.object({
  query: z.string().min(10).max(5000),
  queryType: z.enum(['text', 'url']),
});
```

**Response 200**
```typescript
interface TextAnalyzeResponse {
  analysisId: string;
  verdict: VerdictLevel;
  score: number;           // 0-100
  confidence: number;      // 0-100
  reasoning: string[];     // 3-7 Thai bullet points
  references: Reference[];
  sourceAnalysis?: SourceAnalysis; // only when queryType === 'url'
  cachedAt?: string;       // ISO 8601 if returned from cache
}

interface Reference {
  id: string;
  sourceName: string;
  url: string;
  stance: Stance;
  excerpt: string;
  publishedAt: string | null;
  credibility: number;
  sourceType: SourceType;
}
```

**Logic**
1. Check `KnownFakeClaim` by `queryHash` → return cached verdict if match (confidence 99)
2. Match against `TrustedSource` domains
3. Score based on: claim match weight, source credibility, stance distribution
4. Save `Analysis` + `Reference[]` to DB
5. Upsert `TrendingEntry` (increment count)

---

### POST `/api/analyze/image`

**Request**: `multipart/form-data`
- Field `image`: File (JPG/PNG/WEBP, max 10 MB)

**Validation**
```typescript
// Check before sending to Gemini
- file.size <= 10 * 1024 * 1024
- file.type in ['image/jpeg', 'image/png', 'image/webp']
```

**Response 200**
```typescript
interface ImageAnalyzeResponse {
  analysisId: string;
  verdict: VerdictLevel;
  score: number;
  confidence: number;
  aiDetection: {
    aiProbability: number;        // 0-100
    detectedModel: string;        // 'Midjourney' | 'DALL-E' | 'Stable Diffusion' | 'unknown'
    reasoning: string[];          // Thai bullets from Gemini
  };
  metadata: {
    hasExif: boolean;
    dimensions: { width: number; height: number } | null;
    fileFormat: string;
    fileSizeKb: number;
    suspiciousSignals: string[];  // Thai
  };
  reverseImageSearch: {           // MVP: mock data
    isMock: true;
    firstSeenAt: string | null;
    appearances: number;
    topUrls: string[];
  };
}
```

**Gemini Integration** (see Section 8)

---

### POST `/api/analyze/source`

**Request**
```typescript
const SourceAnalyzeSchema = z.object({
  url: z.string().url(),
});
```

**Response 200**
```typescript
interface SourceAnalyzeResponse {
  domain: string;
  domainAgeDays: number | null;
  sslStatus: 'valid' | 'invalid' | 'none';
  whoisPrivacy: boolean;
  isKnownPhishing: boolean;
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
  riskReasonsTh: string[];
  socialAccountAnalysis: {          // MVP: mock
    isMock: true;
    accountAge: string;
    postFrequency: string;
    followerRatio: number;
    coordinatedBehavior: boolean;
    coordinatedCount: number | null;
  } | null;
}
```

**Risk level logic**
- `dangerous`: in `SuspiciousDomain` table OR domain age < 30 days AND no SSL
- `suspicious`: domain age < 180 days OR WHOIS privacy OR no SSL
- `safe`: trusted source domain OR all checks pass

---

### GET `/api/trending`

**Query params**: `period=day|week|month` (default: `day`)

**Response 200**
```typescript
interface TrendingResponse {
  period: 'day' | 'week' | 'month';
  updatedAt: string;
  items: TrendingItem[];
}

interface TrendingItem {
  rank: number;
  queryPreview: string;    // first 80 chars of most recent query for this hash
  checkCount: number;
  changePercent: number;   // vs previous period
  lastVerdict: VerdictLevel;
  analysisId: string;      // for linking to cached result
  lastCheckedAt: string;
}
```

---

### GET `/api/references/:analysisId`

**Response 200**: `Reference[]` (same type as in text analyze response)

**Response 404**: `ApiError` with code `NOT_FOUND`

---

### GET `/api/health`

**Response 200**
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-04-23T00:00:00.000Z"
}
```

---

## 7. Rate Limiting

- **Limit**: 30 requests/minute per IP
- **Applied to**: all `/api/*` routes via middleware
- **Response on exceed**: HTTP 429 + `ApiError` with code `RATE_LIMITED`
- **Implementation**: sliding window counter in-memory (acceptable for single-process MVP)

```typescript
// lib/rate-limit.ts
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
// Map<ip, { count, windowStart }>
```

---

## 8. Gemini Integration

### Client Setup (`lib/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

### Prompt Template

```
You are an expert forensic image analyst. Analyze the provided image and determine if it was generated by AI.

Respond ONLY in valid JSON with this exact structure:
{
  "aiProbability": <number 0-100>,
  "detectedModel": "<Midjourney|DALL-E|Stable Diffusion|unknown>",
  "reasoning": ["<Thai bullet 1>", "<Thai bullet 2>", ...],
  "confidence": <number 0-100>
}

Analysis criteria:
- Check for unnatural textures, lighting inconsistencies, warped text/hands/fingers
- Look for AI generation artifacts (halos, blending errors, symmetry anomalies)
- Examine background coherence and depth consistency
- All reasoning must be in Thai language
- If unsure, set aiProbability to 50 and confidence to 40
```

### Response Type

```typescript
interface GeminiImageResult {
  aiProbability: number;
  detectedModel: string;
  reasoning: string[];
  confidence: number;
}
```

### Graceful Fallback
If Gemini API call fails (network error, API error, invalid JSON response):
- Return `aiProbability: 50, detectedModel: 'unknown', reasoning: ['ไม่สามารถวิเคราะห์ได้ในขณะนี้'], confidence: 0`
- Log error server-side
- **Never throw** — endpoint must return 200 with fallback data

---

## 9. Docker Compose

```yaml
# docker-compose.yml
version: '3.9'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/fakenews
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
    command: sh -c "npx prisma migrate deploy && npx prisma db seed && node server.js"

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fakenews
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
```

---

## 10. Prisma Schema

See `docs/data-schema.md` for full schema. Key notes:
- `Analysis.queryHash` — SHA-256 of lowercased, whitespace-normalized query
- `TrendingEntry` — unique on `(queryHash, period)`, upserted on each analysis
- Cascade delete: `Reference` deleted when parent `Analysis` deleted

---

## 11. Scoring Logic (`services/text-analyzer.ts`)

```
score = base_score + modifiers

base_score:
  - Known fake claim match (queryHash) → score = 5 (always DANGEROUS/SUSPICIOUS)
  - No match → score = 50 (start neutral)

modifiers:
  + Each TRUSTED_MEDIA/FACT_CHECKER source opposing   → -8 each (min 0)
  + Each TRUSTED_MEDIA/FACT_CHECKER source supporting → +8 each (max 100)
  + Suspicious domain detected                         → -25
  + Known fake claim partial match (>80% similarity)   → -20
  + AI confidence < 60%                                → no penalty, show warning UI

Final verdict = scoreToVerdict(score)
```

---

## 12. CORS & Security

```typescript
// next.config.ts
headers: [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
    ],
  },
]
```

- CORS restricted to `localhost` origins only (MVP)
- No cookies, no sessions
- API keys only in server-side env vars (never in `NEXT_PUBLIC_*`)

---

## 13. i18n (next-intl)

- Default locale: `th`
- Supported: `th`, `en`
- Translation files: `messages/th.json`, `messages/en.json`
- Language persisted in `localStorage` key `snbs_lang`
- Middleware: `middleware.ts` using `createMiddleware` from next-intl
- All verdict labels, stance badges, error messages, nav, privacy banner translated

---

## 14. Testing

### Unit Tests (Vitest)
- `services/text-analyzer.ts` — min 5 tests
- `services/image-analyzer.ts` — min 5 tests
- `services/source-analyzer.ts` — min 5 tests
- `hooks/useLocalHistory.ts` — min 5 tests
- API Zod validation — min 5 tests

### E2E (Playwright)
- Happy path: submit text → verify result page loads with verdict

### Test Setup
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

Mock strategy: `vi.mock('../lib/prisma')` + `vi.mock('../lib/gemini')` in all service tests.

---

## 15. Non-Functional Implementation Notes

| NF ID | Implementation |
|-------|---------------|
| NF.1 | TailwindCSS responsive utilities; min-width 360px tested |
| NF.2 | next-intl default `th`; primary actions in hero above fold |
| NF.3 | Zod on both client (react-hook-form) and server (route handlers) |
| NF.4 | `TrendingEntry` + `KnownFakeClaim` act as cache; Prisma query indexes on `queryHash` |
| NF.5 | shadcn/ui components are keyboard-accessible; Thai `aria-label` on all interactive elements |
| NF.6 | No IP stored; `x-forwarded-for` used only for rate limiting, not persisted |
| NF.7 | Tailwind `dark:` variants; `prefers-color-scheme` detection |
| NF.8 | `docker compose up` starts everything; seed runs automatically |
| NF.9 | README.md with setup steps, env guide, API docs |
| NF.10 | Vitest + Playwright as above |
| NF.11 | Rate limiting middleware + CORS config |
| NF.12 | `prisma/seed.ts` auto-runs in docker compose command |
| NF.13 | `lib/errors.ts` `formatError()` used in every catch block |
| NF.14 | `tsconfig.json` strict: true; ESLint + Prettier configured |
