## Project: ชัวร์ก่อนแชร์ (Sure Before Share) - Fake News Detector MVP

### Product Goal

To provide Thai internet users with a trustworthy, privacy-first web application and Chrome extension for quickly verifying news credibility before sharing. The system presents evidence from multiple reputable sources rather than AI opinion, helping users build their own judgment against misinformation.

### Brand & Design

| Item | Value |
| ---- | ----- |
| Product Name | ชัวร์ก่อนแชร์ (Sure Before Share) |
| Tagline | ตรวจสอบข่าวก่อนส่งต่อ เพราะข่าวปลอมแพร่เร็วกว่าที่คุณคิด |
| Primary Color | #1E40AF (Trust Blue) |
| Danger Color | #DC2626 (Fake/Danger Red) |
| Verified Color | #059669 (Verified Green) |
| Typography | IBM Plex Sans Thai (400, 500, 600) |
| Design Voice | จริงจัง สุภาพ น่าเชื่อถือ แบบสำนักข่าว |

### Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 14+ (App Router) + TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| State | Zustand + TanStack Query |
| Validation | Zod |
| AI (Image) | Google Gemini API (gemini-2.5-flash) |
| Deployment | Local Docker Compose only (no production deploy) |

---

### Functional Requirements

| ID | User Story | Acceptance Criteria (AC) |
| -- | ---------- | ------------------------ |
| **FR.1** | **Access & Privacy** | |
| FR.1.1 | As a user, I want to access the web application without authentication, so I can verify news immediately without friction. | 1. The application loads instantly without login screen or required credentials. 2. No personal data is collected at any point. |
| FR.1.2 | As a user, I want my check history stored locally in my browser, so my privacy is protected. | 1. All history records are persisted in `localStorage` (web) or `chrome.storage.local` (extension). 2. A visible banner displays "🔒 ข้อมูลเก็บในเครื่องคุณเท่านั้น ไม่ส่งไป server". 3. No history is transmitted to any backend. |
| FR.1.3 | As a user, I want to clear my local history at any time, so I can control my data. | 1. A "Clear all history" button exists on the History page with confirmation dialog. 2. Individual records can be deleted with a trash icon. 3. After clearing, localStorage for history key is completely removed. |
| **FR.2** | **News Content Analysis** | |
| FR.2.1 | As a user, I want to paste text, URL, or upload an image to verify news, so I can check any format of content. | 1. Home page has a single large input area with 3 toggle tabs: Text / URL / Image. 2. Text tab accepts up to 5000 characters. 3. URL tab validates URL format before submission. 4. Image tab accepts JPG/PNG/WEBP up to 10MB. 5. A primary "ตรวจสอบ" button triggers analysis. |
| FR.2.2 | As a user, I want to see the credibility score as one of 5 clear levels with a percentage, so I can understand verdict at a glance. | 1. Result displays one of 5 levels with matching color: อันตราย (0-20%, red), น่าสงสัย (21-40%, orange), ไม่แน่ใจ (41-60%, yellow), ค่อนข้างจริง (61-80%, lime), ยืนยันแล้ว (81-100%, green). 2. A 5-segment progress bar highlights the current level. 3. Numerical score 0-100 is displayed alongside level label. |
| FR.2.3 | As a user, I want to see the percentage of references that support vs. oppose the claim, so I can weigh the evidence. | 1. Three stat cards display: % supporting sources, % opposing sources, % unchecked. 2. Total reference count is shown (e.g., "19/20 แหล่ง"). 3. Each percentage adds up to 100%. |
| FR.2.4 | As a user, I want to see AI confidence level separately from credibility score, so I know when to be skeptical of the tool itself. | 1. AI confidence shown as separate metric (e.g., "AI confidence: 92%"). 2. If confidence < 60%, display warning "⚠ AI ยังไม่มั่นใจในผลนี้ กรุณาตรวจสอบเพิ่มเติม". |
| FR.2.5 | As a user, I want to see reasoning explained in Thai bullet points, so I understand why this verdict was given. | 1. Result page displays "ทำไมถึงน่าสงสัย" section with 3-7 bullet points in Thai. 2. Each bullet starts with a signal icon (⚠/!/?). 3. Bullets are clickable to expand detailed explanation. |
| **FR.3** | **Reference Management** | |
| FR.3.1 | As a user, I want to see the list of reference sources used to verify the claim, so I can read the originals myself. | 1. Result page includes "แหล่งอ้างอิง" section listing all references. 2. Each reference shows: source name, stance badge (ยืนยัน/คัดค้าน/เป็นกลาง), excerpt (max 200 chars), publication date, credibility badge. 3. Each reference has a clickable link opening in new tab. |
| FR.3.2 | As a user, I want references categorized by credibility of the source, so I can prioritize trusted outlets. | 1. References are sortable by source credibility (default: highest first). 2. Badge colors indicate source tier: TRUSTED_MEDIA (blue), FACT_CHECKER (green), ACADEMIC (purple), GOV (gray). 3. Top-tier sources (credibility ≥ 80) are visually prominent. |
| FR.3.3 | As a user, I want the system to seed with well-known Thai and international sources, so I trust the base dataset. | 1. Database is pre-seeded with minimum 20 trusted sources. 2. Thai sources include: ไทยรัฐ, มติชน, ประชาชาติ, ไทยพีบีเอส, AFP Fact Check TH, ศูนย์ต่อต้านข่าวปลอม, Sure And Share Center, Cofact Thailand. 3. International sources include: BBC, Reuters, AP News, Snopes, FactCheck.org, PolitiFact. |
| **FR.4** | **Source & Account Analyzer** | |
| FR.4.1 | As a user, I want to analyze the domain of a news URL, so I can identify suspicious websites. | 1. When a URL is submitted, the system calls `/api/analyze/source` automatically. 2. Results show: domain age (days), SSL status (valid/invalid/none), WHOIS privacy status, known phishing status. 3. Risk level is displayed as 3 tiers: ปลอดภัย (green), น่าสงสัย (yellow), อันตราย (red). |
| FR.4.2 | As a user, I want to see warnings about suspicious social media accounts that shared this news, so I can spot bot behavior. | 1. If a social media URL is provided, account analysis is triggered. 2. Displayed signals: account age, post frequency, follower/following ratio, coordinated posting detection. 3. For MVP, social account analysis returns mock data with clear "(MVP: mock data)" label. |
| FR.4.3 | As a user, I want to see if multiple accounts posted the same content simultaneously, so I can detect information operations. | 1. Coordinated behavior detection flags cases where 5+ accounts posted identical text within 30-minute window. 2. If detected, display badge "⚠ พบเครือข่าย [N] บัญชี โพสต์ข้อความเดียวกัน". 3. For MVP, this feature uses seeded demo data. |
| **FR.5** | **AI-Generated Image Detection** | |
| FR.5.1 | As a user, I want to upload an image and know if it was generated by AI, so I can identify fake visual content. | 1. Image upload triggers `/api/analyze/image`. 2. Image is sent to Google Gemini API for analysis. 3. Result displays: AI probability (0-100%), detected model (Midjourney/DALL-E/Stable Diffusion/unknown), signal list in Thai. 4. Gemini response is parsed and normalized into the standard result format. |
| FR.5.2 | As a user, I want to see the image metadata analysis, so I can verify authenticity manually. | 1. Metadata section displays: EXIF presence, dimensions, file format, file size. 2. Missing EXIF is flagged as suspicious signal. 3. Unusual dimensions (e.g., 1024x1024 square) are noted as potential AI indicator. 4. Gemini's reasoning is shown as bullet points in Thai. |
| FR.5.3 | As a user, I want to see if the image appeared elsewhere online before, so I can detect recycled misleading images. | 1. Reverse image search returns: first seen date, number of appearances, top matching URLs. 2. For MVP, returns mock data with "(MVP: reverse search placeholder)" label. 3. UI is built to accept real API response format for future integration. |
| **FR.6** | **Trending Searches** | |
| FR.6.1 | As a user, I want to see which news items are being checked most today, so I can stay aware of trending misinformation. | 1. `/trending` page displays top 20 most-checked queries. 2. Each entry shows: rank, query text, check count, % change from previous period, verdict badge. 3. Period selector: วันนี้ / สัปดาห์นี้ / เดือนนี้. |
| FR.6.2 | As a user, I want trending data to be anonymized, so my privacy is protected. | 1. No IP addresses, user agents, or personal data are stored with trending counts. 2. Only query text (hashed for similar detection) and verdict are aggregated. 3. Privacy notice on trending page: "ข้อมูลเป็นสถิติรวม ไม่มีการเก็บข้อมูลผู้ใช้". |
| FR.6.3 | As a user, I want trending entries to be clickable to see full results, so I can learn from others' verifications. | 1. Clicking a trending entry opens the cached result page. 2. Result page shows "ตรวจครั้งล่าสุด: [timestamp]". 3. User can re-verify with "ตรวจสอบอีกครั้ง" button. |
| **FR.7** | **Local History** | |
| FR.7.1 | As a user, I want to see my past verification history in the browser, so I can revisit previous checks. | 1. `/history` page displays list of past checks from localStorage. 2. Each entry shows: query preview (truncated), verdict badge, timestamp (relative: "2 ชม.ที่แล้ว"). 3. Maximum 100 entries stored; oldest auto-removed when limit exceeded. |
| FR.7.2 | As a user, I want to search and filter my local history, so I can quickly find past checks. | 1. Search input filters by query text (substring match). 2. Filter dropdown filters by verdict level (อันตราย/น่าสงสัย/ไม่แน่ใจ/ค่อนข้างจริง/ยืนยันแล้ว/ทั้งหมด). 3. Date range filter: today / this week / this month / all time. |
| FR.7.3 | As a user, I want to export my history as JSON, so I can backup or share it. | 1. "Export JSON" button downloads a `.json` file with all history entries. 2. File structure: `{ version: "1.0", exported_at: ISO date, items: HistoryItem[] }`. 3. "Import JSON" accepts the same format and merges with existing history (no duplicates). |

---

### Non-Functional Requirements

| ID | Category | Requirement |
| -- | -------- | ----------- |
| NF.1 | Design/UX | The application must be fully responsive and usable on desktop, tablet, and mobile devices (minimum viewport 360px). |
| NF.2 | Usability | The interface must be in Thai by default with option to switch to English. Primary actions must be discoverable within 3 seconds of landing. |
| NF.3 | Validation | All user inputs must be validated with Zod schemas on both client and server. Invalid inputs must display Thai error messages inline. |
| NF.4 | Performance | Analysis results must return within 3 seconds for text/URL, 5 seconds for image. Cache hit should return within 500ms. |
| NF.5 | Accessibility | All interactive elements must support keyboard navigation. Color contrast must meet WCAG AA. Screen reader labels must be in Thai. |
| NF.6 | Privacy | No user identifying data (IP, user agent, cookies) may be persisted server-side. Analytics, if added, must be self-hosted and anonymized. |
| NF.7 | Dark Mode | The application must support light and dark modes with automatic detection from system preference. |
| NF.8 | Development | The entire stack must run locally via `docker compose up` with a single command. No production deployment is required for MVP. |
| NF.9 | Documentation | README.md must include setup steps, environment variables guide, and API documentation. |
| NF.10 | Testing | Minimum 5 unit tests per core service (text-analyzer, image-detector, source-analyzer, useLocalHistory hook). One E2E happy path test using Playwright. |
| NF.11 | Security | API endpoints must implement rate limiting (30 req/min per IP). CORS must be configured to allow only `localhost` origins. |
| NF.12 | Data Seed | Database must auto-seed on first `docker compose up` with: 20+ trusted sources, 10+ known fake claims, 10+ suspicious domains. |
| NF.13 | Error Handling | All API errors must return JSON format: `{ error: { code, message_th, message_en } }`. UI must display friendly Thai error messages, never raw stack traces. |
| NF.14 | Code Quality | All code must pass ESLint + Prettier. TypeScript strict mode must be enabled. No `any` types without explicit justification comment. |

---

### Data Models (Prisma Schema Reference)

| Model | Purpose | Key Fields |
| ----- | ------- | ---------- |
| `Analysis` | Stores each verification request | id, query, verdict, score, level, confidence, createdAt |
| `Reference` | Sources used to verify a claim | id, analysisId, sourceName, url, stance, excerpt, credibility |
| `TrustedSource` | Pre-seeded reputable outlets | id, name, domain, type, credibility, language, isActive |
| `KnownFakeClaim` | Previously verified fake news | id, claim, verdict, evidence, firstSeenAt |
| `SuspiciousDomain` | Known problematic domains | id, domain, reason, addedAt |
| `TrendingEntry` | Aggregated trending counts | id, queryHash, period, count, lastVerdict |

---

### API Endpoints

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| POST | `/api/analyze/text` | Analyze text or URL content |
| POST | `/api/analyze/image` | Analyze image for AI-generation + reverse search |
| POST | `/api/analyze/source` | Analyze domain/account credibility |
| GET | `/api/trending` | Get top trending queries (query param: period=day\|week\|month) |
| GET | `/api/references/:analysisId` | Get all references for an analysis |
| GET | `/api/health` | Health check endpoint |

---

### Milestones

| Phase | Scope | Deliverable |
| ----- | ----- | ----------- |
| **Phase 1: Foundation** | Next.js + Docker + Prisma setup, DB seed | `docker compose up` runs successfully, DB seeded |
| **Phase 2: Core API** | `/api/analyze/text`, `/api/analyze/source`, `/api/trending` with mock logic | All endpoints return valid JSON with Zod validation |
| **Phase 3: Web UI** | Home, Result, History, Trending pages | Full user flow works end-to-end on web |
| **Phase 4: Image Detection** | `/api/analyze/image` + Google Gemini integration + UI upload component | Image verification works via Gemini API |
| **Phase 5: Polish** | Dark mode, i18n, error states, tests, docs | Full README, tests pass, production-ready UX |

---

### Out of Scope (MVP)

- User authentication / account system
- Payment / subscription features
- Native mobile apps (iOS/Android)
- Production deployment (Vercel/AWS/GCP)
- Multi-language beyond Thai and English
- Community notes / collaborative fact-checking
- Real-time notifications
- Admin dashboard / moderation tools
- Real social media API integration (use mocks for MVP)
- Real reverse image search API (use mocks for MVP)
- Chrome Extension (browser badge injection, popup, content scripts)
