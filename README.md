# DevBloom Studio

DevBloom Studio is a small Next.js app for guided creative coding lessons. Learners pick a project, edit real code, and see the result in a live preview.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project structure

- `app/`: Next.js routes, layouts, and global styles
- `components/`: shared UI plus lesson-specific interface components
- `lib/projects/`: lesson configs, starter code helpers, and shared project types
- `lib/preview.ts`: preview document generator used by lesson projects
