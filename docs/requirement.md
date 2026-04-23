# Functional Requirements — ชัวร์ก่อนแชร์ (Sure Before Share)

> Derived from `docs/initial-requirement.md`. Excludes tech stack, API specs, and DB schemas (see `docs/data-schema.md` and `docs/technical-spec.md`).

---

## FR.1 — Access & Privacy

### FR.1.1 — No-Auth Access
**User story:** As a user, I want to access the web application without authentication so I can verify news immediately without friction.

**Acceptance criteria:**
1. The application loads without any login screen or required credentials.
2. No personal data is collected at any point during use.

---

### FR.1.2 — Local History Storage
**User story:** As a user, I want my check history stored locally in my browser so my privacy is protected.

**Acceptance criteria:**
1. All history records are persisted in `localStorage` (web) or `chrome.storage.local` (extension).
2. A visible privacy banner displays: "🔒 ข้อมูลเก็บในเครื่องคุณเท่านั้น ไม่ส่งไป server" on every page.
3. No history data is transmitted to any backend server.

---

### FR.1.3 — Clear Local History
**User story:** As a user, I want to clear my local history at any time so I can control my data.

**Acceptance criteria:**
1. A "Clear all history" button exists on the History page with a confirmation dialog before deletion.
2. Individual records can be deleted using a trash icon.
3. After clearing, the localStorage key for history is completely removed (not set to empty array).

---

## FR.2 — News Content Analysis

### FR.2.1 — Multi-Format Input
**User story:** As a user, I want to paste text, URL, or upload an image to verify news so I can check any format of content.

**Acceptance criteria:**
1. Home page has a single large input area with 3 toggle tabs: Text / URL / Image.
2. Text tab accepts up to 5,000 characters with character counter displayed.
3. URL tab validates URL format before submission; invalid URLs show inline Thai error.
4. Image tab accepts JPG, PNG, WEBP files up to 10 MB.
5. A primary "ตรวจสอบ" (Verify) button triggers analysis.

---

### FR.2.2 — 5-Level Credibility Score
**User story:** As a user, I want to see the credibility score as one of 5 clear levels with a percentage so I can understand the verdict at a glance.

**Acceptance criteria:**
1. Result displays one of 5 levels with matching colors:
   - อันตราย (0–20%, red `#DC2626`)
   - น่าสงสัย (21–40%, orange `#D97706`)
   - ไม่แน่ใจ (41–60%, yellow `#CA8A04`)
   - ค่อนข้างจริง (61–80%, lime `#65A30D`)
   - ยืนยันแล้ว (81–100%, green `#059669`)
2. A 5-segment progress bar highlights the current level segment.
3. Numerical score 0–100 is displayed alongside the level label.

---

### FR.2.3 — Evidence Breakdown
**User story:** As a user, I want to see the percentage of references that support vs. oppose the claim so I can weigh the evidence.

**Acceptance criteria:**
1. Three stat cards display: % supporting sources, % opposing sources, % unchecked.
2. Total reference count is shown (e.g., "19/20 แหล่ง").
3. Each percentage adds up to 100%.

---

### FR.2.4 — AI Confidence Indicator
**User story:** As a user, I want to see the AI confidence level separately from the credibility score so I know when to be skeptical of the tool itself.

**Acceptance criteria:**
1. AI confidence is shown as a separate metric (e.g., "AI confidence: 92%").
2. If confidence < 60%, display warning: "⚠ AI ยังไม่มั่นใจในผลนี้ กรุณาตรวจสอบเพิ่มเติม".

---

### FR.2.5 — Thai Reasoning Bullets
**User story:** As a user, I want to see reasoning explained in Thai bullet points so I understand why this verdict was given.

**Acceptance criteria:**
1. Result page includes "ทำไมถึงน่าสงสัย" section with 3–7 bullet points in Thai.
2. Each bullet starts with a signal icon (⚠ / ! / ?).
3. Bullets are clickable to expand a detailed explanation.

---

## FR.3 — Reference Management

### FR.3.1 — Reference List
**User story:** As a user, I want to see the list of reference sources used to verify the claim so I can read the originals myself.

**Acceptance criteria:**
1. Result page includes "แหล่งอ้างอิง" section listing all references.
2. Each reference shows: source name, stance badge (ยืนยัน / คัดค้าน / เป็นกลาง), excerpt (max 200 chars), publication date, credibility badge.
3. Each reference has a clickable link that opens in a new tab.

---

### FR.3.2 — Source Credibility Sorting
**User story:** As a user, I want references categorized by credibility of the source so I can prioritize trusted outlets.

**Acceptance criteria:**
1. References are sortable by source credibility (default: highest credibility first).
2. Badge colors indicate source tier: TRUSTED_MEDIA (blue), FACT_CHECKER (green), ACADEMIC (purple), GOV (gray).
3. Top-tier sources (credibility ≥ 80) are visually prominent.

---

### FR.3.3 — Pre-seeded Trusted Sources
**User story:** As a user, I want the system seeded with well-known Thai and international sources so I trust the base dataset.

**Acceptance criteria:**
1. Database is pre-seeded with minimum 20 trusted sources.
2. Thai sources include: ไทยรัฐ, มติชน, ประชาชาติ, ไทยพีบีเอส, AFP Fact Check TH, ศูนย์ต่อต้านข่าวปลอม, Sure And Share Center, Cofact Thailand.
3. International sources include: BBC, Reuters, AP News, Snopes, FactCheck.org, PolitiFact.

---

## FR.4 — Source & Account Analyzer

### FR.4.1 — Domain Analysis
**User story:** As a user, I want to analyze the domain of a news URL so I can identify suspicious websites.

**Acceptance criteria:**
1. When a URL is submitted, domain analysis runs automatically.
2. Results show: domain age (days), SSL status (valid / invalid / none), WHOIS privacy status, known phishing status.
3. Risk level displayed as 3 tiers: ปลอดภัย (green), น่าสงสัย (yellow), อันตราย (red).

---

### FR.4.2 — Social Account Analysis (MVP: mock)
**User story:** As a user, I want to see warnings about suspicious social media accounts that shared this news so I can spot bot behavior.

**Acceptance criteria:**
1. If a social media URL is provided, account analysis is triggered.
2. Displayed signals: account age, post frequency, follower/following ratio, coordinated posting detection.
3. Social account analysis returns mock data with clear "(MVP: mock data)" label.

---

### FR.4.3 — Coordinated Behavior Detection (MVP: seeded demo)
**User story:** As a user, I want to see if multiple accounts posted the same content simultaneously so I can detect information operations.

**Acceptance criteria:**
1. Flags cases where 5+ accounts posted identical text within a 30-minute window.
2. If detected, display badge: "⚠ พบเครือข่าย [N] บัญชี โพสต์ข้อความเดียวกัน".
3. Feature uses seeded demo data for MVP.

---

## FR.5 — AI-Generated Image Detection

### FR.5.1 — AI Image Analysis
**User story:** As a user, I want to upload an image and know if it was generated by AI so I can identify fake visual content.

**Acceptance criteria:**
1. Image upload triggers image analysis API.
2. Image is sent to Google Gemini API for analysis.
3. Result displays: AI probability (0–100%), detected model (Midjourney / DALL-E / Stable Diffusion / unknown), signal list in Thai.
4. Gemini response is parsed and normalized into the standard result format.

---

### FR.5.2 — Image Metadata Analysis
**User story:** As a user, I want to see the image metadata analysis so I can verify authenticity manually.

**Acceptance criteria:**
1. Metadata section displays: EXIF presence, dimensions, file format, file size.
2. Missing EXIF is flagged as a suspicious signal.
3. Unusual dimensions (e.g., 1024×1024 square) are noted as a potential AI indicator.
4. Gemini's reasoning is shown as bullet points in Thai.

---

### FR.5.3 — Reverse Image Search (MVP: mock)
**User story:** As a user, I want to see if the image appeared elsewhere online before so I can detect recycled misleading images.

**Acceptance criteria:**
1. Reverse image search returns: first seen date, number of appearances, top matching URLs.
2. MVP returns mock data with "(MVP: reverse search placeholder)" label.
3. UI is built to accept real API response format for future integration.

---

## FR.6 — Trending Searches

### FR.6.1 — Trending List
**User story:** As a user, I want to see which news items are being checked most today so I can stay aware of trending misinformation.

**Acceptance criteria:**
1. `/trending` page displays top 20 most-checked queries.
2. Each entry shows: rank, query text, check count, % change from previous period, verdict badge.
3. Period selector: วันนี้ / สัปดาห์นี้ / เดือนนี้.

---

### FR.6.2 — Anonymized Trending Data
**User story:** As a user, I want trending data to be anonymized so my privacy is protected.

**Acceptance criteria:**
1. No IP addresses, user agents, or personal data are stored with trending counts.
2. Only query text (hashed for similarity detection) and verdict are aggregated.
3. Privacy notice on trending page: "ข้อมูลเป็นสถิติรวม ไม่มีการเก็บข้อมูลผู้ใช้".

---

### FR.6.3 — Clickable Trending Entries
**User story:** As a user, I want trending entries to be clickable to see full results so I can learn from others' verifications.

**Acceptance criteria:**
1. Clicking a trending entry opens the cached result page.
2. Result page shows "ตรวจครั้งล่าสุด: [timestamp]".
3. User can re-verify with "ตรวจสอบอีกครั้ง" button.

---

## FR.7 — Local History

### FR.7.1 — History List
**User story:** As a user, I want to see my past verification history in the browser so I can revisit previous checks.

**Acceptance criteria:**
1. `/history` page displays list of past checks from localStorage.
2. Each entry shows: query preview (truncated), verdict badge, timestamp (relative: "2 ชม.ที่แล้ว").
3. Maximum 100 entries stored; oldest auto-removed when limit exceeded.

---

### FR.7.2 — Search & Filter History
**User story:** As a user, I want to search and filter my local history so I can quickly find past checks.

**Acceptance criteria:**
1. Search input filters by query text (substring match).
2. Filter dropdown filters by verdict level (อันตราย / น่าสงสัย / ไม่แน่ใจ / ค่อนข้างจริง / ยืนยันแล้ว / ทั้งหมด).
3. Date range filter: today / this week / this month / all time.

---

### FR.7.3 — Export/Import History
**User story:** As a user, I want to export my history as JSON so I can back up or share it.

**Acceptance criteria:**
1. "Export JSON" button downloads a `.json` file with all history entries.
2. File structure: `{ version: "1.0", exported_at: ISO date, items: HistoryItem[] }`.
3. "Import JSON" accepts the same format and merges with existing history (no duplicates by `id`).
