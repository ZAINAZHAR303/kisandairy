# Kisan Dairy

Dairy farm management for Pakistani farmers, live at [kisandairy.tech](https://kisandairy.tech).

Farmers use it to track:

- **Animals** — cows and buffaloes, with breed, age and status
- **Breeding** — insemination records, pregnancy status and expected calving dates
- **Vaccinations** — what was given, what is due and what is overdue
- **Milk sales** — daily sales per buyer, payments received and outstanding balances
- **Expenses** — feed, medicine, labour and other costs
- **Reports** — monthly profit statements, with Excel and PDF export

It installs as an app on a phone (PWA) and keeps working without a connection:
milk sales, payments and expenses entered offline are stored on the device and
sent to the server when the connection returns.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions) and React 19
- [Supabase](https://supabase.com) for authentication and the Postgres database
- Tailwind CSS 4
- A hand-written service worker (`public/sw.js`) and IndexedDB for offline use
- Deployed on Vercel

> **Next.js 16 differs from older versions.** Before changing framework-level
> code, read the matching guide in `node_modules/next/dist/docs/` (see `AGENTS.md`).

## Getting started

Requirements: Node.js 20 or newer, and a Supabase project.

```bash
npm install
```

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Do not point local development at the production database.** Real farmers'
records live there. Use a separate Supabase project for development and testing.

## Scripts

| Command         | What it does                      |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the development server      |
| `npm run build` | Create a production build         |
| `npm run start` | Serve the production build        |
| `npm run lint`  | Run ESLint                        |

Type-check with `npx tsc --noEmit`.

## Project structure

```
src/
  app/
    page.tsx              Landing page
    login/                Email, phone (OTP) and Google sign-in
    auth/                 OAuth callback and password reset
    dashboard/            Signed-in area; one folder per feature
      <feature>/page.tsx      loads data on the server
      <feature>/actions.ts    server actions that write data
    api/sync/             Receives offline records from the service worker
  components/             UI, grouped by feature
  lib/
    actions.ts            Shared auth, error handling and form parsing for server actions
    dateUtils.ts          Date helpers (farm time zone is Asia/Karachi)
    offlineDb.ts          IndexedDB queue for records saved offline
    syncManager.ts        Sends the offline queue to the server
    supabase/             Supabase clients, session proxy and paged fetching
  proxy.ts                Redirects signed-out visitors away from /dashboard
public/
  sw.js                   Service worker: caching and background sync
```

## Things to know before changing code

- **Database.** Tables are `animals`, `insemination_records`, `vaccination_records`,
  `sellers` (shown as "buyers" in the UI), `milk_sale_entries`, `seller_payments`
  and `expenses`. Every row has a `user_id`. The schema and row-level security
  policies live in the Supabase dashboard and are not yet versioned in this repo.
- **Row limits.** Supabase returns at most 1,000 rows per request. Load lists with
  `fetchAllRows` (`src/lib/supabase/fetchAll.ts`), never a bare `select`.
- **Dates.** Servers run in UTC. Use `todayDateString(FARM_TIME_ZONE)` on the
  server and `todayDateString()` in the browser — never `toISOString()` for "today".
- **Offline sync.** The page and the service worker both send the offline queue,
  guarded by a shared lock. If you change the IndexedDB stores, update both
  `src/lib/offlineDb.ts` and `public/sw.js`.
- **Server actions** return `{ data, error }` or `{ error }` instead of throwing.
  Build new ones with the helpers in `src/lib/actions.ts`.

## Deployment

The app is hosted on Vercel. Because farmers use it daily, test every change on
a preview deployment before it reaches `main`, and set the two environment
variables above in the Vercel project.
