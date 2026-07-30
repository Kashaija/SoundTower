# SoundTower — Prototype

This prototype follows the SoundTower PRD: Next.js App Router + Supabase + Tailwind. It includes:

- API route: POST /api/search — calls Supabase RPC `match_categories`, falls back to LLM generation per PRD.
- Frontend: src/app/page.tsx — search UI, chips, predictive dropdown (stub), result layout, regenerate button.
- Supabase SQL: schema.sql (includes table and RPC).

Prereqs
- Node 18+
- pnpm/npm/yarn
- (optional) Supabase project with `pgvector` enabled; create a table using schema.sql and run the `match_categories` function.
- (optional) OpenAI API Key — if set, the app will call OpenAI for real embeddings and LLM fallback.

Environment variables
- NEXT_PUBLIC_SUPABASE_URL - Supabase URL (optional for local running without DB)
- SUPABASE_SERVICE_KEY - Supabase service role key (optional)
- OPENAI_API_KEY - OpenAI key for embeddings and LLM fallback (optional)

Install and run
- npm install
- npm run dev
- Open http://localhost:3000

Run tests
- npm run test

Notes
- If you don't configure Supabase or OpenAI, the server uses deterministic mocks so the app and tests still run locally.
- To wire real Supabase, create the table and function in schema.sql and seed entries with embeddings (1536-d vectors).
- The app enforces the crisis-override UI server-side and client-side based on keywords.
