# ชัวร์ก่อนแชร์ — Claude Code Guide

## Project Overview
Thai fake news detector web app. MVP only — no auth, no production deploy, local Docker Compose.

## Stack
- Next.js 14+ (App Router) + TypeScript (strict mode)
- TailwindCSS + shadcn/ui
- PostgreSQL 15 + Prisma ORM
- Zustand + TanStack Query
- Zod validation (client + server)
- Google Gemini API (`gemini-2.5-flash`) for image analysis
- next-intl for Thai/English i18n

## Running Locally
```bash
docker compose up        # starts app (port 3000) + db (PostgreSQL)
npm run dev              # dev server only (requires DB running)
npm run db:seed          # seed DB with trusted sources, fake claims, suspicious domains
npm test                 # Vitest unit tests
```

## Key Conventions
- All API errors: `{ error: { code, message_th, message_en } }` — never raw stack traces
- All inputs validated with Zod schemas
- Rate limiting: 30 req/min per IP on all /api/* routes
- No personal data (IP, user agent) stored server-side — history in localStorage only
- Trending uses hashed queries, not raw text
- TypeScript: no `any` without justification comment

## Docs
- `docs/requirement.md` — functional requirements (FR.1–FR.7)
- `docs/data-schema.md` — Prisma schema + localStorage schema
- `docs/technical-spec.md` — architecture, API contracts, env vars
- `docs/ui-requirement.md` — screen-by-screen UX reference

## Environment Variables
See `.env.example` for all required vars. Key ones:
- `DATABASE_URL` — PostgreSQL connection string
- `GEMINI_API_KEY` — Google Gemini API key
