# Formic

A reusable, configuration-driven form-building platform in the spirit of
Typeform: build a form visually, publish it, share a link, and analyze
responses — without any survey content hardcoded into the app itself.

## Architecture

Every form is plain, serializable data (`FormSchema` in `lib/types.ts`). The
UI is a thin, generic renderer over that data, which is what makes the
platform reusable instead of a one-off survey:

```
Form Builder  ──▶  Form Schema  ──▶  Logic Engine  ──▶  Respondent Engine  ──▶  Response Storage  ──▶  Analytics
 (dashboard UI)     (JSON/JSONB)     (pure functions)    (shared hook + UI)     (Postgres via RLS)     (dashboard)
```

- **Form Schema** (`lib/types.ts`) — `FormSchema`, `Question` (a discriminated
  union over 12 types), `LogicRule`, `ThemeConfig`, `FormResponse`, `Answer`.
  A form's `questions`, `logic_rules` and `theme` are stored as JSONB columns
  on the `forms` table, so the whole schema round-trips as one JSON document.
- **Question type registry** (`lib/questions/registry.ts`) — each question
  type (`yes_no`, `single_choice`, `multiple_choice`, `rating`, `scale`,
  `short_text`, `long_text`, `number`, `email`, `date`, `ranking`,
  `information`) is a self-contained module under `lib/questions/modules/`
  exporting a renderer, a builder-side editor, a validator, and a default
  config. Adding a new question type is: one new module file + one line in
  the registry — nothing else in the app changes.
- **Logic engine** (`lib/logic/engine.ts`) — pure, unit-testable functions
  that resolve the next/previous visible question from a schema + the
  current answers. Rules support AND/OR condition groups and `show` / `skip`
  / `jump` / `end` actions, with operators appropriate to each question type
  (`equals`, `contains`, `greater_than`, `is_empty`, ...).
- **Respondent engine** (`lib/respondent/`) — a single hook
  (`useRespondent`) and shared UI (`components/respondent/RespondentForm`)
  that walk the schema through the logic engine, one question per screen.
  It is used identically by the public form at `/f/[slug]` and by the
  builder's `/preview` — preview mode passes a no-op persistence
  implementation (`createNoopPersistence`) so nothing is ever written to the
  real `responses` table while testing a form.
- **Response storage** — normalized `responses` / `answers` tables (see
  `supabase/migrations/0001_init.sql`) for analytics-friendly querying,
  alongside the JSONB schema on `forms`.
- **Analytics** (`lib/analytics/compute.ts`) — pure functions for
  completion rate, average completion time, per-question answer
  distributions, and drop-off (which question respondents most often stall
  on), rendered on `/dashboard/forms/[id]/responses`.

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4, with a small set of shadcn/ui-style primitives under
  `components/ui/` (built directly on Radix UI primitives, since the
  `shadcn` CLI's registry fetch wasn't reachable in this environment —
  functionally and visually equivalent to a CLI-generated setup)
- Supabase: Postgres + Supabase Auth (email/password) + Storage (logo
  uploads)
- `@dnd-kit` for drag-and-drop question reordering
- `recharts` for response distribution charts
- Deployable on Vercel

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the Project URL, `anon` public key,
   and `service_role` key into `.env.local` (see `.env.example`).
3. Run the migration in `supabase/migrations/0001_init.sql` against your
   project — either:
   - paste it into the Supabase SQL editor and run it, or
   - with the Supabase CLI: `supabase link --project-ref <ref>` then
     `supabase db push`.

   This creates `forms`, `responses`, and `answers`, a `form-assets` storage
   bucket for logo uploads, and Row Level Security policies:
   - Form owners (`auth.uid() = owner_id`) have full read/write access to
     their own forms and to the responses/answers under them.
   - Anonymous/public visitors can only `SELECT` forms where
     `status = 'published'`, and can only `INSERT`/`UPDATE` responses and
     answers against forms in that same state — so a draft or closed form's
     data is never reachable by the public, and a respondent can only ever
     write into a form they're allowed to see.
4. Email/password auth is enabled by default in Supabase; no extra
   configuration is required for sign-up/login to work.

## Environment variables

| Variable | Where it's used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | public, RLS-protected |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | secret, bypasses RLS — never expose to the client |

## Deploying to Vercel

1. Push this repository to GitHub (already done if you're reading this from
   a PR).
2. Import the repo in Vercel as a new project — it auto-detects Next.js.
3. Add the three environment variables above in the Vercel project's
   **Settings → Environment Variables**.
4. Deploy. No build configuration is required beyond the default
   `next build`.

## Project structure

```
app/
  page.tsx                       marketing landing page
  login/, signup/                Supabase Auth pages
  dashboard/                     protected (middleware-gated) creator area
    page.tsx                     form list: search, sort, create, duplicate, delete, status
    forms/[id]/build/            builder: questions, logic, design tabs
    forms/[id]/preview/          respondent engine in no-op preview mode
    forms/[id]/responses/        response analytics + CSV/JSON export
  f/[slug]/                      public respondent experience (published forms only)
lib/
  types.ts                       FormSchema / Question / LogicRule / ThemeConfig / FormResponse
  questions/                     question type registry + one module per type
  logic/engine.ts                pure logic engine
  respondent/                    shared respondent hook, persistence, local progress storage
  analytics/compute.ts           completion rate, drop-off, distributions
  export/export.ts               CSV / JSON export
  supabase/                      browser/server/middleware Supabase clients
supabase/migrations/             SQL schema + RLS policies
```

## Design choices & simplifications

- **shadcn/ui components are hand-authored, not CLI-generated.** The
  `shadcn` CLI needs a live registry fetch that this build environment
  couldn't reach; `components/ui/*` follows the same structure, class
  patterns, and Radix primitives the CLI would have generated, so it's a
  drop-in equivalent — running `npx shadcn@latest add <component>` later
  will work against the same `components.json`.
- **Export format.** CSV/JSON export is implemented directly; "Excel
  compatibility" is delivered as CSV with a UTF-8 BOM (`lib/export/export.ts`)
  rather than a binary `.xlsx` writer, to avoid pulling in `xlsx` (which has
  an unresolved prototype-pollution advisory on npm at the time of writing).
  BOM-prefixed CSV opens correctly in Excel with non-ASCII characters
  intact; if a native `.xlsx` is required later, swap in a maintained writer
  (e.g. `exceljs`) behind the same `exportCsv`/`exportJson` call sites.
- **Ranking question reordering** uses up/down controls rather than a nested
  drag-and-drop list, to avoid nesting two independent dnd-kit contexts
  (the question list is already draggable) inside one form screen.
- **Demo content.** No real survey content is seeded. A creator's first form
  starts as an empty "Untitled form" — add questions from the builder.
