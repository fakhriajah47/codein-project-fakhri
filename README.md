# Project Management

AI-assisted project management app for agencies and software teams. Project Management combines workspace/project tracking, Kanban task execution, AI risk analysis, executive reports, and Discord/Telegram/Gmail delivery in a Next.js 16 App Router application backed by Supabase.

## Stack

- Next.js 16 App Router and React 19
- Supabase Auth, Postgres, RLS, and Storage-ready schema
- Google Gemini API for task generation, risk analysis, daily focus, and executive summaries
- Discord webhooks, Telegram bot alerts, and Gmail/SMTP report delivery
- Tailwind CSS v4 with Modern Neobrutalism UI components

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment values:

```bash
cp .env.example .env.local
```

3. Fill `.env.local` with Supabase, Gemini, integration, and SMTP/OAuth values. Do not commit `.env.local` or `docs/ENV.md`.

4. Apply the Supabase schema from `docs/12.md` in your Supabase SQL editor or migration pipeline.

5. Start development:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run seed:demo
```

`seed:demo` reads credentials from `.env.local`; it does not contain hardcoded secrets.

## Core Flows

- Register/login through `/api/auth/*`.
- Complete onboarding to create a workspace.
- Create projects, milestones, and tasks.
- Move tasks through `/api/tasks/[taskId]/status` or project Kanban.
- Generate AI task breakdowns, risk analysis, daily focus, and executive report drafts.
- Connect Discord, Telegram, and Gmail from Integrations.
- Send project updates, risk alerts, and Gmail executive reports.

## API Coverage

The implementation follows the route map in `docs/16.md`, including workspace/project/task CRUD, Kanban, AI generation, reports, integrations, notification logs, dashboard, my-work, and activity endpoints.

## Security Notes

- Supabase RLS is the database boundary.
- Server routes still enforce active workspace membership and owner/manager mutations.
- Integration secrets are stored server-side in `integration_settings` and masked in API responses.
- `docs/ENV.md` is ignored because it contains local secret material.
