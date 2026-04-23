# UI Requirement — ชัวร์ก่อนแชร์

Screen-by-screen UX reference for implementation. All text defaults to Thai. See `ui-prototypes/` for rendered HTML.

---

## Design Tokens

| Token | CSS Var | Value |
|-------|---------|-------|
| Primary | `--color-primary` | `#1D4ED8` (trust blue, WCAG-AAA on white) |
| Primary hover | `--color-primary-hover` | `#1E40AF` |
| Danger | `--color-danger` | `#B91C1C` (muted red, not pure red) |
| Verified | `--color-verified` | `#047857` (earthy green) |
| Warning | `--color-warning` | `#B45309` (desaturated amber) |
| Neutral | `--color-neutral` | `#6B7280` |
| Surface | `--color-surface` | `#FFFFFF` |
| Surface secondary | `--color-surface-secondary` | `#F8FAFC` |
| Border | `--color-border` | `#E2E8F0` |
| Text primary | `--color-text-primary` | `#0F172A` |
| Text secondary | `--color-text-secondary` | `#475569` |
| Font | — | IBM Plex Sans Thai (400/500/600) via Google Fonts CDN |
| Border radius | — | 16px cards, 10px inputs/items, 8px buttons, 100px pills |

### Dark mode (`prefers-color-scheme: dark`)
- bg: `#0A0F1E`, surface: `#111827`, surface-secondary: `#1E293B`
- border: `#1E293B`, text-primary: `#F1F5F9`, text-secondary: `#94A3B8`
- Palette colors shift to desaturated/lighter tonal variants (not inverted)

---

## Global Layout

### Privacy Banner (all pages)
- Sticky top bar above header
- Text: ShieldCheckIcon (16×16 SVG, no emoji) + "ข้อมูลเก็บในเครื่องคุณเท่านั้น ไม่ส่งไป server"
- Light: `bg-sky-50 border-sky-200 text-sky-700`. Dark: `bg-sky-950 border-sky-900 text-sky-300`

### Header
- **Sticky + glassmorphism**: `sticky top-0 z-50`, `background: rgba(255,255,255,0.85)`, `backdrop-filter: blur(12px)`
- Left: Logo — CheckIcon SVG (20×20, no ✓ text) in blue rounded square + "ชัวร์ก่อนแชร์" wordmark
  - **Logo overflow fix**: `min-w-0 flex-shrink-0` on logo link; wordmark hidden below `sm` breakpoint (`hidden sm:block`); `truncate` on wordmark text
- Right: nav links (หน้าหลัก / ยอดนิยม / ประวัติ) — **no language toggle button**
- Active nav: `border-b-2 border-blue-700 text-blue-700` (bottom underline, not bg highlight)
- Height: 60px
- Skip link: `<a href="#main" class="sr-only focus:not-sr-only ...">ข้ามไปเนื้อหาหลัก</a>` as first child (hidden unless focused)

---

## Screen 1 — Home (`/`)

### Hero Section
- Dark navy `#0F172A` bg + subtle radial glow (primary blue, ~18% opacity) — no solid gradient
- H1: "ตรวจสอบข่าวก่อนส่งต่อ" (2.25rem mobile → 3rem desktop, weight 600)
- Tagline: "เพราะข่าวปลอมแพร่เร็วกว่าที่คุณคิด — ตรวจสอบด้วย AI และแหล่งข้อมูลที่น่าเชื่อถือ"
- Trust pills row below tagline: 3 `<span>` pills — "✓ AI วิเคราะห์", "✓ แหล่งข้อมูลไทย", "✓ ปลอดภัย 100%"
  - Style: `bg-white/10 border border-white/20 text-white/90 rounded-full px-3.5 py-1 text-sm font-medium`
- Input card overlaps hero with negative top margin (−32px)

### Input Card
- **Glassmorphism**: `background: rgba(255,255,255,0.97)`, `backdrop-filter: blur(20px)`, border `1px solid rgba(255,255,255,0.6)`, `box-shadow: 0 8px 32px rgba(0,0,0,0.12)`, `border-radius: 16px`
- Dark mode: `background: rgba(17,24,39,0.97)`, border `rgba(255,255,255,0.06)`

**Tab switcher** — 3 tabs with heroicon + Thai label:
- ChatBubbleLeftIcon + `ข้อความ` / LinkIcon + `URL` / PhotoIcon + `รูปภาพ`
- Active tab: white bg + primary color text + bottom border animation 150ms; inactive: transparent
- `role="tablist"`, `aria-selected` on each tab

**Input type label**: Small caps Thai above each panel (`text-xs font-medium text-slate-500 uppercase tracking-wider`) — "พิมพ์ข้อความ" / "วาง URL" / "อัปโหลดภาพ"

**Text tab**
- `<textarea>` min-height 120px, resize vertical, 5000 char max
- Character counter bottom-right: `0/5000`, turns orange at 4500+

**URL tab**
- Single `<input type="url">` full-width
- Inline Thai error on blur if invalid: "กรุณาใส่ URL ที่ถูกต้อง เช่น https://..."
- Hint text: ระบบจะวิเคราะห์ทั้งเนื้อหาและความน่าเชื่อถือของเว็บไซต์

**Image tab**
- Dashed upload zone (2px dashed border), centered icon + text
- On hover: border → primary, bg → `#EFF6FF`
- Supports drag-and-drop and click-to-browse
- After file select: zone shows filename + file size + CheckIcon
- Max 10 MB; over limit shows Thai alert: "ไฟล์มีขนาดเกิน 10 MB กรุณาเลือกไฟล์ใหม่"

**Submit button**: Full-width, height 52px, weight 600
- Default: MagnifyingGlassIcon (20×20) + "ตรวจสอบ", primary blue
- Loading: ArrowPathIcon (20×20, `animate-spin motion-reduce:animate-none`) + "กำลังวิเคราะห์...", disabled

### How-to Section ("วิธีใช้งาน")
3-column grid on desktop, stacks on mobile. Each card: step number + icon (28×28) + Thai label
- Step 1: PencilSquareIcon — "ใส่ข้อมูล"
- Step 2: SparklesIcon — "AI วิเคราะห์"
- Step 3: CheckCircleIcon — "ดูผลลัพธ์"

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

### Verdict Banner
**Full-width card** (replaces score circle):
- `border-l-4` with verdict color (100% opacity) + verdict color at ~6% opacity bg
- Left: verdict icon SVG 48×48 (XCircleIcon/DANGEROUS, ExclamationTriangleIcon/SUSPICIOUS, QuestionMarkCircleIcon/UNCERTAIN, CheckIcon/LIKELY_TRUE, CheckCircleIcon/VERIFIED)
- Large Thai verdict text (1.5rem, weight 700)
- Score: `<span class="tabular-nums" style="font-size:3rem">{score}</span>/100 คะแนน`
- **5-Segment Bar**: 5 equal segments, active at full opacity, others at 25%; smooth fill 400ms ease-out
- Segment labels: อันตราย / น่าสงสัย / ไม่แน่ใจ / ค่อนข้างจริง / ยืนยันแล้ว
- AI confidence badge; warning if < 60%: amber bg

### Evidence Stats (3 cards)
- Supporting / Opposing / Neutral with % + count ("18/20 แหล่ง")
- Each card: `border-l-4` accent — support = emerald-600, oppose = red-700, neutral = slate-400

### Reasoning Section — "ทำไมถึงน่าสงสัย"
- Card with `bg-yellow-50` (light) / `bg-zinc-800` (dark)
- Bullet list, staggered fade-in (50ms delay per item) — skip if `prefers-reduced-motion`
- AI disclaimer at bottom: `<p class="text-xs italic text-slate-400">* ผลการวิเคราะห์นี้มาจาก AI และอาจมีข้อผิดพลาด โปรดใช้วิจารณญาณ</p>`

### References Section — "แหล่งอ้างอิง"
- Sort dropdown: เรียงตามความน่าเชื่อถือ / วันที่ / จุดยืน
- Each ref card:
  - 32×32 avatar circle (first letter of source name, `bg-slate-100 rounded-full`)
  - Source name (bold) + source type badge + stance badge (right-aligned)
  - Source type badge colors: FACT_CHECKER green, TRUSTED_MEDIA blue, GOV gray, ACADEMIC purple
  - Stance badge: ยืนยัน (green) / คัดค้าน (red) / เป็นกลาง (gray)
  - Excerpt text (max 200 chars, muted)
  - "อ่านต้นฉบับ →" with external link SVG icon (opens new tab); hover: shadow-md

### Source Analysis (URL submissions only)
- Domain, domain age, SSL status, WHOIS status in 2×2 grid
- Risk badge top-right: ปลอดภัย (green) / น่าสงสัย (yellow) / อันตราย (red)

### Action Bar
- ArrowLeftIcon SVG + "ตรวจสอบใหม่" + ArrowPathIcon SVG + "ตรวจสอบอีกครั้ง" + "📋 คัดลอกผลลัพธ์"
- Right: "แชร์ผลลัพธ์" (primary)

---

## Screen 3 — History (`/history`)

### Page Header
- Title "ประวัติการตรวจสอบ" + subtitle "เก็บไว้ในเครื่องของคุณเท่านั้น • สูงสุด 100 รายการ"
- Right: ArrowDownTrayIcon (Export), ArrowUpTrayIcon (Import), TrashIcon + "ลบทั้งหมด" (danger style)

### Filter Bar
- Search input: full-width, 44px height, MagnifyingGlassIcon (18×18) leading icon (absolute positioned), `pl-10`, clear X button when non-empty
- **Verdict filter**: horizontal scrollable pill buttons (replaces `<select>` dropdown)
  - Options: ทั้งหมด / อันตราย / น่าสงสัย / ไม่แน่ใจ / ค่อนข้างจริง / ยืนยันแล้ว
  - Active pill: `bg-blue-700 text-white border-blue-700`; inactive: `border-slate-200 hover:border-blue-700`
  - Each pill: `rounded-full px-3.5 py-1 text-sm font-medium border min-h-[36px]`

### Results Count
- "แสดง N รายการ" updates live as filters change

### History Item Row
- `border-l-4` verdict color accent: DANGEROUS=red-700, SUSPICIOUS=amber-700, UNCERTAIN=yellow-700, LIKELY_TRUE=lime-700, VERIFIED=emerald-700
- Type icon SVG (ChatBubbleLeftIcon/text, LinkIcon/url, PhotoIcon/image — 20×20, no emoji)
- Query text (truncated, bold) + meta line (type label • relative time)
- Verdict badge (right) + Score "XX/100" (right)
- TrashIcon SVG delete button (`min-h-[44px] min-w-[44px]`) — hidden, appears on hover/focus

### Empty State
- Centered illustration placeholder + "ยังไม่มีประวัติการตรวจสอบ" + CTA "เริ่มตรวจสอบ"

### Clear All Modal
- Overlay card modal; warning with item count
- Buttons: "ยกเลิก" (secondary) + "ลบทั้งหมด" (danger, red bg)

### Export/Import
- Export: downloads `snbs-history.json` with `{ version, exported_at, items[] }`
- Import: file picker, merges by `id`, enforces 100-entry limit, Thai error on bad format

---

## Screen 4 — Trending (`/trending`)

### Page Header
- Title: FireIcon SVG (22×22, orange-500) + "ข่าวที่ถูกตรวจสอบมากที่สุด" (no 🔥 emoji)
- Subtitle "อัปเดตทุก 15 นาที — ข้อมูลรวมไม่ระบุตัวตน"

### Period Tab Switcher
- Segmented control: วันนี้ / สัปดาห์นี้ / เดือนนี้
- `aria-pressed` on each button
- Active: primary blue bg + white text
- Switching period: 5 skeleton shimmer rows `animate-pulse h-16 bg-slate-200 rounded-xl` during load (300ms)

### Privacy Notice
- LockClosedIcon SVG (16×16, no 🔐 emoji) + "ข้อมูลเป็นสถิติรวม ไม่มีการเก็บข้อมูลผู้ใช้ — เฉพาะจำนวนครั้งที่ตรวจสอบและผลลัพธ์เท่านั้น"

### Trending List (up to 20 items)
Each row:
- Rank number (2rem, `tabular-nums`) — styled, not emoji: rank 1 = amber-500, rank 2 = slate-400, rank 3 = amber-700
- Top 3 rows: `border-l-4` accent (rank 1 = amber-500, rank 2 = slate-400, rank 3 = amber-700)
- Query text (2-line truncate, weight 600)
- Count badge + verdict badge (right)
- Trend indicators: ArrowUpIcon SVG (12×12, green) / ArrowDownIcon SVG (12×12, red) — no ▲/▼ text chars
- Click row → cached result page

---

## Verdict Color System (shared across all screens)

| Level | Thai | Score | Border color | Text color |
|-------|------|-------|--------------|------------|
| DANGEROUS | อันตราย | 0–20 | `#B91C1C` | `#B91C1C` |
| SUSPICIOUS | น่าสงสัย | 21–40 | `#B45309` | `#B45309` |
| UNCERTAIN | ไม่แน่ใจ | 41–60 | `#CA8A04` | `#CA8A04` |
| LIKELY_TRUE | ค่อนข้างจริง | 61–80 | `#65A30D` | `#65A30D` |
| VERIFIED | ยืนยันแล้ว | 81–100 | `#047857` | `#047857` |

Badge classes: `badge-danger`, `badge-suspicious`, `badge-uncertain`, `badge-likely`, `badge-verified`

---

## Icon System

- **All structural UI icons**: Heroicons v2 outline style, inline SVG, `aria-hidden="true"`
- Default size: 24×24px, `stroke-width: 1.5`
- Emoji allowed only as decorative emphasis within Thai content text, not as UI controls
- Key icons by context:
  - Header logo: CheckIcon (20×20, sw 2.5)
  - Privacy banner: ShieldCheckIcon (16×16)
  - Input tabs: ChatBubbleLeftIcon / LinkIcon / PhotoIcon (16×16)
  - Submit: MagnifyingGlassIcon (loading), ArrowPathIcon spin (loading)
  - Verdict: XCircleIcon / ExclamationTriangleIcon / QuestionMarkCircleIcon / CheckIcon / CheckCircleIcon (48×48 on result)
  - History: ArrowDownTrayIcon / ArrowUpTrayIcon / TrashIcon / MagnifyingGlassIcon
  - Trending: FireIcon (22×22) / LockClosedIcon (16×16) / ArrowUpIcon / ArrowDownIcon (12×12)
  - Navigation: ArrowLeftIcon / ArrowPathIcon (16×16)

---

## Accessibility

- All text contrast ≥ 4.5:1 (body), ≥ 3:1 (large text/icons) — WCAG AA min, AAA target
- Visible focus rings: 2px solid `#1D4ED8`, 2px offset
- All interactive elements ≥ 44×44px touch target
- Skip-to-main link on every page (`sr-only`, visible on focus)
- `aria-pressed` on tab/filter buttons; `aria-selected` on tab switchers; `aria-label` on icon-only buttons
- Color never sole indicator — always paired with icon or label
- `tabular-nums` (`font-variant-numeric: tabular-nums`) on all scores, counts, rank numbers

---

## Animation Rules

- Transitions: `color, background-color, border-color, opacity, transform; 150ms ease-out`
- Enter animations: fade-in + translateY(8px→0), 200ms ease-out
- No width/height/top/left animation
- List item stagger: 30ms per item, max 10 items (rest instant)
- Skeleton shimmer: gradient sweep 1.5s linear infinite
- Disabled state: opacity 0.5, `cursor: not-allowed`
- **All animations gated**: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| ≥ 760px | Full layout as described |
| < 640px (`sm`) | Logo wordmark hidden, icon-only header logo |
| < 560px | Stats/summary grids wrap or stack; verdict banner stacks vertically |
| < 480px | Filter pills scroll horizontally; period tabs full-width |
| min 360px | All layouts must remain usable |

---

## Interaction Notes

- All page transitions: `window.location.href` (prototypes); Next.js App Router in implementation
- Relative timestamps: `date-fns` or custom Thai formatter ("2 นาทีที่แล้ว", "เมื่อวาน", "3 วันที่แล้ว")
- Dark mode: automatic via `prefers-color-scheme` — no manual toggle in MVP
- **No language toggle** — Thai-only UI in MVP; language switching removed
- History stored in `localStorage` only — no personal data (IP, user agent) server-side
- Trending uses hashed queries, not raw text
