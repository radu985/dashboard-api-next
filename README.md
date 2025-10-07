# Case Dashboard (Next.js)

A modern case management dashboard built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Radix UI. It provides case listing, search, details modal with CV download links, contact management, and a confirmation-link workflow with polling.

## Features
- Case list with search and filters
- Detail modal with CV download (original/redacted), email subject/body, contacts table
- Polling every 10s to update `confirm_url` links
- Local caching via `localStorage` to reduce flicker
- Upload endpoint supporting local storage or Vercel Blob
- Optional Redis (Upstash) persistence; in-memory fallback
- Vercel Analytics integration

## Tech Stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS + Radix UI components
- Upstash Redis (optional)
- Vercel Blob (optional)

## Getting Started

### 1) Install dependencies
```bash
npm install --legacy-peer-deps
```
Note: `vaul` peers target React ≤ 18, so we use `--legacy-peer-deps` with React 19.

### 2) Environment variables
Create `.env.local` in the project root:
```env
# Required for authenticated writes to /api/cases and /api/upload
CASES_TOKEN=your_secure_token

# Optional: Vercel Blob for file storage (fallback: /public/uploads)
BLOB_READ_WRITE_TOKEN=

# Optional: Upstash Redis to persist cases across restarts (fallback: in-memory)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
Generate a token (example):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3) Run the dev server
```bash
npm run dev
```
App runs at `http://localhost:3000` (if busy, Next will choose another port and print it).

## Project Structure
- `app/page.tsx` — Case dashboard UI with polling and search
- `app/layout.tsx` — Root layout, fonts, analytics
- `components/` — UI components (`CaseCard`, `CaseDetailModal`, shadcn/Radix wrappers)
- `lib/casesStore.ts` — In-memory store with optional Upstash Redis backend
- `app/api/` — API routes
  - `cases` (GET, POST) — list/add cases
  - `cases/[id]` (PATCH) — update one case
  - `caselink` (GET, POST) — get/set confirmation link per case
  - `upload` (POST) — upload original/redacted files

## API Reference

### GET /api/cases
Response:
```json
{ "cases": [/* CaseItem */] }
```

### POST /api/cases
Headers: `x-cases-token: <CASES_TOKEN>`
Body: `CaseItem` or array of `CaseItem`.
Response: `{ ok: true, count: number }`

### PATCH /api/cases/[id]
Headers: `x-cases-token: <CASES_TOKEN>`
Body: Partial `CaseItem`.
Response: `{ ok: true, case: CaseItem }`

### GET /api/caselink?caseId=ID
Response: `{ id: string, confirm_url: string | undefined }`

### POST /api/caselink
Body: `{ caseId: string, link: string }`
Response: `{ message: string, case: CaseItem }`

### POST /api/upload
Headers: `x-cases-token: <CASES_TOKEN>`
FormData keys: `original` (File), `redacted` (File)
Response: `{ ok: true, urls: { original, redacted } }`

## Security Notes
- `CASES_TOKEN` protects write endpoints. Keep it secret and set in prod env too.
- `case-detail-modal` renders `email_body` using `dangerouslySetInnerHTML`. Ensure server-side sanitization if content is user-supplied.

## Troubleshooting
- Hydration mismatch with browser extensions: root `html` uses `suppressHydrationWarning`.
- Port already in use: Next picks another port; check terminal output.
- Peer dep conflicts (React 19 vs `vaul`): install with `--legacy-peer-deps` or remove/replace `vaul`.
- Cache issues on Windows: delete `.next` and re-run `npm run dev`.

## Deployment
- Vercel recommended. Add the same env vars in Project → Settings → Environment Variables.
- If Redis/Blob not configured, app still runs (in-memory store, local uploads).

## License
MIT
