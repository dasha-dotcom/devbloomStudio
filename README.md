# DevBloom Studio

DevBloom Studio is a guided creative coding app for ages 9-12 that helps beginners learn HTML, CSS, and JavaScript through visual, project-based lessons.

Many beginner coding resources feel abstract, text-heavy, or intimidating. DevBloom is designed to make coding feel more creative and understandable by letting learners build real web projects, edit code in the browser, see their changes instantly in a live preview, answer prediction/checkpoint questions, and reflect on what they built.

Live demo: https://devbloom-studio.vercel.app

## Why I built this

I built DevBloom because I teach kids coding and noticed that many beginners do not struggle because they are “bad at coding.” They struggle because coding often feels abstract, text-heavy, and disconnected from what they can actually see or create.

When students are given long instructions or code that feels mysterious, they often skip steps, copy without understanding, or lose confidence quickly. In early testing, I saw that students were more engaged when they could immediately see their code change the page, but they needed shorter guidance and clearer moments to pause and think.

DevBloom is my attempt to make coding feel more creative, visual, and understandable. The lesson flow is built around small edits, live preview, prediction prompts, checkpoints, and reflection so students can practice thinking like developers instead of just following instructions.

## Features

The app currently includes:

- A public landing page and project library
- Four playable guided lessons
- A lesson shell with Monaco editor, live preview, checkpoints, prediction prompts, reflection, finish screens, and restart/reset flows
- Local persistence for public lesson progress
- Teacher authentication with Supabase
- Teacher dashboards for creating classes, generating join codes, and managing student rosters
- Student join flow using a class code, roster selection, and 6-digit PIN
- Server-backed student project attempts with resume, autosave, reset, and save-and-exit support

## Current lesson projects

- `all-about-me`: beginner HTML lesson for building a page about something you like
- `vibe-page`: CSS styling lesson focused on color, layout, and mood
- `mood-switch`: JavaScript interaction lesson built around a click-driven mood toggle
- `build-your-own-mini-site`: mixed HTML/CSS/JavaScript builder lesson with guided starter choices

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Monaco Editor
- Supabase SSR auth
- Drizzle ORM
- Postgres

## Run locally

Requirements:

- Node `22.x`
- A Postgres database
- A Supabase project for teacher auth

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the values used by the app:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
DATABASE_URL=...
DIRECT_DATABASE_URL=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Notes:

- `DIRECT_DATABASE_URL` is optional, but Drizzle will prefer it when running CLI commands.
- `NEXT_PUBLIC_SITE_URL` is recommended for auth email redirects. If omitted, the app falls back to the request host.

3. Apply database migrations:

```bash
npm run db:migrate
```

4. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run validate:projects
```

## App areas

- `app/`: Next.js routes, layouts, server actions, and API routes
- `components/`: shared UI, lesson shell, teacher UI, and student UI
- `lib/projects/`: lesson definitions, starter code, preview builders, and project metadata
- `lib/persistence/`: local-storage and server-backed project attempt persistence
- `lib/db/`: Drizzle database client and schema
- `lib/student/`, `lib/teacher/`, `lib/auth/`: session, roster, and auth logic

## Notes on behavior

- Public lessons under `/projects/[slug]` save progress in local storage.
- Student lessons under `/student/attempts/[attemptId]` save through the database-backed attempt API.
- Teacher-facing class and roster management are implemented. Teacher-side progress reporting is planned as a future improvement.
