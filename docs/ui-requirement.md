# UI Requirement — ชัวร์ก่อนแชร์

Screen-by-screen UX reference for implementation. All text defaults to Thai. See `ui-prototypes/` for rendered HTML.

---

## Design Tokens

| Token | Value |
|-------|-------|
| Primary | `#1E40AF` |
| Danger | `#DC2626` |
| Warning | `#D97706` |
| Yellow | `#CA8A04` |
| Lime | `#65A30D` |
| Verified | `#059669` |
| Font | IBM Plex Sans Thai (400/500/600) via Google Fonts CDN |
| Border radius | 12px cards, 10px inputs/items, 8px buttons, 100px pills |
| Dark mode | `prefers-color-scheme: dark` — bg `#0F172A`, surface `#1E293B`, border `#334155` |

---

## Global Layout

### Privacy Banner (all pages)
- Sticky top bar above header
- Text: `🔒 ข้อมูลเก็บในเครื่องคุณเท่านั้น ไม่ส่งไป server`
- Light: `#EFF6FF` bg, `#1E40AF` text. Dark: `#1e3a5f` bg, `#93C5FD` text.

### Header
- Left: Logo icon (36×36px blue rounded square with ✓) + "ชัวร์ก่อนแชร์" wordmark
- Right: nav links (หน้าหลัก / ยอดนิยม / ประวัติ) + TH/EN toggle button
- Active nav item: `#EFF6FF` bg + primary color text
- Height: 60px, white bg, bottom border

---

## Screen 1 — Home (`/`)

### Hero Section
- Blue gradient banner (`#1E40AF → #2563EB`), white text
- H1: "ตรวจสอบข่าวก่อนส่งต่อ" (32px, weight 600)
- Tagline: "เพราะข่าวปลอมแพร่เร็วกว่าที่คุณคิด — ตรวจสอบด้วย AI และแหล่งข้อมูลที่น่าเชื่อถือ"
- Card overlaps hero with negative top margin (−32px)

### Input Card
**Tab switcher** — 3 tabs in a pill container:
- `📝 ข้อความ` / `🔗 URL` / `🖼 รูปภาพ`
- Active tab: white bg + primary color + subtle shadow; inactive: transparent

**Text tab**
- `<textarea>` min-height 140px, 5000 char max
- Character counter bottom-right: `0/5000`, turns orange at 4500+
- Focus: border turns `#1E40AF`

**URL tab**
- Single `<input type="url">` full-width
- Inline Thai error on blur if invalid: "กรุณาใส่ URL ที่ถูกต้อง เช่น https://..."
- Hint text below: ระบบจะวิเคราะห์ทั้งเนื้อหาและความน่าเชื่อถือของเว็บไซต์

**Image tab**
- Dashed upload zone (2px dashed border), centered icon + text
- On hover: border → primary, bg → `#EFF6FF`
- Supports drag-and-drop and click-to-browse
- After file select: zone shows filename + file size + ✅ icon
- Max 10 MB; over limit shows Thai alert: "ไฟล์มีขนาดเกิน 10 MB กรุณาเลือกไฟล์ใหม่"
- Accepts: `.jpg .jpeg .png .webp`

**Submit button**: Full-width, `🔍 ตรวจสอบ`, primary blue, 16px 600 weight

### Stats Row
Three equal-width cards below the input card:
- Total checks, % suspicious, number of trusted sources
- Decorative only on home — real-time numbers from API on implementation

### Recent Checks List
- Section title "ตรวจสอบล่าสุด"
- Each row: verdict badge + truncated query + relative time
- Click → navigates to result page
- Shows last 3 from localStorage

---

## Screen 2 — Result (`/result/[id]`)

### Query Display Strip
- Small label "ข้อความที่ตรวจสอบ" + full query text (truncated with ellipsis at 200 chars)
- "ตรวจครั้งล่าสุด: [relative time]" below

### Verdict Card
**Left: Score Circle** (100×100px)
- Border color = verdict color, 6px
- Large number (score 0–100) + label "คะแนน"

**Right: Verdict Info**
- Level label with icon: `⚠ อันตราย` / `🟠 น่าสงสัย` / `🟡 ไม่แน่ใจ` / `🟢 ค่อนข้างจริง` / `✅ ยืนยันแล้ว`
- Subtitle in Thai
- **5-Segment Bar**: 5 equal segments, only current segment at full opacity, others at 25%
  - Colors L→R: red / orange / yellow / lime / green
- Segment labels below bar: อันตราย / น่าสงสัย / ไม่แน่ใจ / ค่อนข้างจริง / ยืนยันแล้ว
- AI confidence badge: `AI confidence: XX%`
- Warning if confidence < 60%: `⚠ AI ยังไม่มั่นใจในผลนี้ กรุณาตรวจสอบเพิ่มเติม` (amber bg)

### Evidence Stats (3 cards, equal columns)
- Supporting (green number) / Opposing (red number) / Neutral (gray number)
- Each shows percentage + count string e.g. "18/20 แหล่ง"

### Reasoning Section — "ทำไมถึงน่าสงสัย"
- Accordion list, 3–7 items
- Each item: icon (⚠ / ! / ?) + summary text
- Click to expand: detail paragraph slides in below a hairline divider
- First item open by default

### References Section — "แหล่งอ้างอิง"
- Sort dropdown: เรียงตามความน่าเชื่อถือ / วันที่ / จุดยืน
- Each ref card:
  - Source name (bold) + source type badge + stance badge (right-aligned)
  - Source type badge colors: FACT_CHECKER green, TRUSTED_MEDIA blue, GOV gray, ACADEMIC purple
  - Stance badge: ยืนยัน (green) / คัดค้าน (red) / เป็นกลาง (gray)
  - Excerpt text (max 200 chars, muted)
  - Footer: publish date + credibility mini-bar (60px wide, 4px tall) + "อ่านต้นฉบับ →" link (opens new tab)

### Source Analysis (URL submissions only)
- Domain, domain age, SSL status, WHOIS status in 2×2 grid
- Risk badge top-right: ปลอดภัย (green) / น่าสงสัย (yellow) / อันตราย (red)

### Action Bar
- Left: "← ตรวจสอบใหม่" + "🔄 ตรวจสอบอีกครั้ง" + "📋 คัดลอกผลลัพธ์"
- Right: "แชร์ผลลัพธ์" (primary)

---

## Screen 3 — History (`/history`)

### Page Header
- Title "ประวัติการตรวจสอบ" + subtitle "เก็บไว้ในเครื่องของคุณเท่านั้น • สูงสุด 100 รายการ"
- Right: Export JSON button, Import JSON button (file input trigger), "🗑 ลบทั้งหมด" (danger style)

### Filter Bar
- Search input (flex-grow) + verdict dropdown + date range dropdown
- Search: substring match on query text, live filter
- Verdict options: ทุกผลลัพธ์ / อันตราย / น่าสงสัย / ไม่แน่ใจ / ค่อนข้างจริง / ยืนยันแล้ว
- Date options: ทุกช่วงเวลา / วันนี้ / สัปดาห์นี้ / เดือนนี้

### Results Count
- "แสดง N รายการ" updates live as filters change

### History Item Row
- Type icon (📝 text / 🔗 url / 🖼 image)
- Query text (truncated, bold) + meta line (type label • relative time)
- Verdict badge (right)
- Score mini "XX/100" (right)
- Trash icon — hidden, appears on row hover; click deletes item (no confirm for single items)
- Click row → result page

### Empty State
- Centered: 📭 icon + "ยังไม่มีประวัติการตรวจสอบ" + CTA button "เริ่มตรวจสอบ"

### Clear All Modal
- Overlay with card modal
- Warning message with item count
- Buttons: "ยกเลิก" (secondary) + "ลบทั้งหมด" (danger, red bg)

### Export/Import
- Export: downloads `snbs-history.json` with `{ version, exported_at, items[] }`
- Import: file picker, merges by `id`, enforces 100-entry limit, shows Thai error on bad format

---

## Screen 4 — Trending (`/trending`)

### Page Header
- Title "🔥 ข่าวที่ถูกตรวจสอบมากที่สุด"
- Subtitle "อัปเดตทุก 15 นาที — ข้อมูลรวมไม่ระบุตัวตน"

### Summary Cards (3 equal columns)
- Today's check count / % fake or suspicious / # trending topics

### Period Tab Switcher
- Pills: วันนี้ / สัปดาห์นี้ / เดือนนี้
- Active: primary blue bg + white text
- Switches data on click (API call with `period` param)

### Privacy Notice
- Muted box: "🔐 ข้อมูลเป็นสถิติรวม ไม่มีการเก็บข้อมูลผู้ใช้ — เฉพาะจำนวนครั้งที่ตรวจสอบและผลลัพธ์เท่านั้น"

### Trending List (up to 20 items, split into 1–10 and 11–20 with section label)
Each row:
- Rank number (1=🥇 gold, 2=🥈 silver, 3=🥉 bronze, 4+ plain gray number)
- Top 3 rows: left border `3px solid #1E40AF`
- Query text (truncated)
- Meta: `🔍 N ครั้ง` + trend indicator (▲ +X% green / ▼ −X% red / — ไม่เปลี่ยน gray) + last-updated timestamp
- Verdict badge (right)
- Click row → cached result page

---

## Verdict Color System (shared across all screens)

| Level | Thai | Score | Color | Badge classes |
|-------|------|-------|-------|---------------|
| DANGEROUS | อันตราย | 0–20 | `#DC2626` red | `badge-danger` |
| SUSPICIOUS | น่าสงสัย | 21–40 | `#D97706` orange | `badge-suspicious` |
| UNCERTAIN | ไม่แน่ใจ | 41–60 | `#CA8A04` yellow | `badge-uncertain` |
| LIKELY_TRUE | ค่อนข้างจริง | 61–80 | `#65A30D` lime | `badge-likely` |
| VERIFIED | ยืนยันแล้ว | 81–100 | `#059669` green | `badge-verified` |

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| ≥ 760px | Full layout as described |
| < 560px | Stats/summary grids wrap or stack; verdict header stacks vertically |
| < 480px | Filter bar stacks vertically; period tabs go full-width; nav labels shorten |
| min 360px | All layouts must remain usable |

---

## Interaction Notes

- All page transitions: `window.location.href` (no SPA routing in prototypes; Next.js App Router in implementation)
- Relative timestamps: use `date-fns` or custom Thai formatter ("2 นาทีที่แล้ว", "เมื่อวาน", "3 วันที่แล้ว")
- Dark mode: automatic via `prefers-color-scheme`; no manual toggle in MVP (system setting only)
- Language toggle: persisted in `localStorage` key `snbs_lang`; swaps all UI labels via next-intl
