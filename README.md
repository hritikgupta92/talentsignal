# TalentSignal

Recruiter public profile platform MVP for a frontend engineering take-home. TalentSignal helps recruiters publish credible professional profiles and helps jobseekers discover, filter, and follow recruiters by hiring domain.

## Product Strategy

This is intentionally not a full hiring platform. The MVP focuses on the highest-signal surface area: recruiter credibility, discovery, following, and a polished profile management workflow.

Recruiters can also manage a lightweight set of active job openings from the dashboard. This keeps the platform useful for candidate engagement without expanding into a full ATS.

## Backend Recommendation

| Option | Speed | Auth | Free tier | DX | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Supabase | Excellent | Built-in email/OAuth | Generous | SQL, RLS, Storage | Best fit |
| Firebase | Excellent | Mature | Generous | NoSQL data modeling | Good, but less relational |
| Appwrite | Good | Built-in | Good | More setup choices | Solid, slower for this MVP |

Supabase is the best choice for this assignment because it gives free Auth, Postgres, Row Level Security, public storage for avatars, SQL schema portability, Edge Functions, and simple Netlify environment configuration.

## Tech Stack

- React 19 + TypeScript + Vite
- TailwindCSS v4 with shadcn-style local primitives
- React Router
- Zustand for role/session demo state
- Framer Motion for subtle page entrance animation
- Lucide Icons
- Supabase client abstraction
- Netlify deployment config

## Architecture

```txt
src/
  components/        shared UI primitives and brand elements
  features/          feature modules: auth and recruiters
  hooks/             cross-feature hooks, including AI bio enhancer
  layouts/           app shell and navigation
  pages/             route-level screens
  services/          Supabase client setup
  types/             type-safe domain models
  lib/               utilities
supabase/
  schema.sql         tables, RLS policies, storage bucket
  functions/         Supabase Edge Functions
```

The data boundary sits behind `features/recruiters/services/recruiterService.ts`, so Supabase table and RPC details do not leak into UI components.

## Core Routes

- `/` landing page
- `/auth` mock role selection and auth entry
- `/auth` includes Login and Signup modes with role-aware onboarding
- `/dashboard` role-aware dashboard for profile editing, domains, experience, and recruiter job openings
- `/discover` jobseeker discovery page
- `/r/:slug` public recruiter profile

## Database Schema

Minimal Supabase schema is in `supabase/schema.sql`.

Tables:

- `users`: auth-linked user records and role
- `recruiter_profiles`: public profile fields, metrics, publish state
- `experiences`: recruiter work history
- `hiring_tags`: reusable hiring domains and filters
- `recruiter_hiring_tags`: many-to-many tag mapping
- `active_jobs`: lightweight active role showcase managed by recruiters
- `follows`: jobseeker follow graph

Storage:

- `avatars` public bucket for recruiter profile images

Policies:

- Published recruiter profiles are publicly readable
- Recruiters can manage only their own profiles
- Jobseekers can create/read their own follows
- Tags are public

## UI/UX Strategy

The visual direction blends LinkedIn trust, Wellfound talent marketplace clarity, Linear-like density, and modern SaaS polish. The interface uses neutral backgrounds, indigo primary actions, emerald hiring status accents, spacious layouts, restrained shadows, rounded-xl cards, and responsive grids. The public profile is the hero surface because it carries the credibility story.

## AI Feature

The dashboard includes an AI bio enhancer backed by a Supabase Edge Function at `supabase/functions/enhance-recruiter-bio`. The browser calls the function with `supabase.functions.invoke`, and the function calls OpenAI server-side using `gpt-4o-mini` with a small output cap so `OPENAI_API_KEY` is never exposed and token cost stays low.

## Execution Roadmap

Hour 1: scaffold Vite, Tailwind, routing, shared UI primitives, domain models.

Hours 2-4: build landing, auth role selection, discovery, recruiter cards, mock data service.

Hours 5-8: build premium public profile, dashboard shell, editor states, AI bio enhancer.

Hours 9-11: Supabase schema, RLS policies, storage plan, environment config.

Hours 12-14: responsive polish, loading/empty states, README, build verification, Netlify deployment.

If short on time, skip real avatar upload and real auth wiring first. Keep the public profile, discovery, and dashboard polish intact.

## Setup

```bash
npm install
npm run dev
```

Optional Supabase:

1. Create a free Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Edge Function setup:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key
supabase functions deploy enhance-recruiter-bio
```

For local function development:

```bash
supabase functions serve enhance-recruiter-bio --env-file ./supabase/.env.local
```

## Deployment

Deploy to Netlify with:

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Supabase secret: `OPENAI_API_KEY`

`netlify.toml` includes the SPA redirect.

## AI Usage Log

AI assistance was used to accelerate product scoping, generate a senior-level implementation plan, scaffold typed React components, design the Supabase schema/RLS policies, and draft README documentation. Human engineering judgment was applied to keep scope narrow, prioritize demo quality, and avoid unnecessary backend complexity.

## Tradeoffs

- Login/Signup use Supabase Auth.
- Dashboard edits persist through Supabase tables, storage, and RPC functions.
- Recruiter job openings support add, edit, and delete flows, but intentionally stop short of applications, candidate pipelines, or ATS workflow.
- AI bio enhancement runs through a Supabase Edge Function so the OpenAI key stays server-side.
- shadcn/ui is represented through local shadcn-style primitives to keep setup fast and fully controlled.

## Future Improvements

- Add follow counts via database functions.
- Add Playwright smoke tests for critical routes.
