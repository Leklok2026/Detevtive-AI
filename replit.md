# محقق — Arabic Detective Investigation Game

A full-stack Arabic detective investigation game with 10 crime cases, AI-powered suspect interrogation (GPT via OpenAI), staged difficulty progression, a premium case paywall, and an admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (`artifacts/api-server`)
- Frontend: React + Vite + Tailwind CSS 4 + wouter (`artifacts/detective-game`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod` (`lib/api-zod`)
- API codegen: Orval (from OpenAPI spec in `lib/api-spec`)
- AI: OpenAI GPT (via Replit AI Integration) for suspect interrogation
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/index.ts` — DB schema (cases, suspects, players, player_progress, game_settings, conversations, messages)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas for validation
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/detective-game/src/pages/` — React page components
- `artifacts/detective-game/src/index.css` — dark noir theme (gold + crimson palette)

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → Zod validators (server) + React Query hooks (client)
- Admin auth: hardcoded key `detective123` stored in localStorage, sent as `?adminKey=` query param
- AI interrogation: GPT model per suspect with personality prompt + deception level; suspect mood tracked per session
- Premium paywall: `paymentEnabled` toggle in `game_settings` table; players with `hasPaid=true` or `paymentExempt=true` bypass
- Free cases: IDs 1, 2, 3, 6 (difficulty 1-3); premium: IDs 4, 5, 7, 8, 9, 10

## Product

- **10 crime cases** staged from easy (difficulty 1) to master (difficulty 5)
- **AI suspects**: each suspect has a personality, backstory, deception level, and secret info — GPT roleplays them
- **Interrogation chat**: real-time conversation with mood indicator (calm/nervous/angry/defensive)
- **Accusation system**: player picks the guilty suspect; correct answer earns reward points
- **Premium system**: first 2 cases free; premium cases require payment (toggle in admin)
- **Admin dashboard**: stats, publish/unpublish cases, player management, payment toggle, free trial count

## User preferences

- Arabic RTL UI throughout
- Dark crime-noir theme: `hsl(260 35% 5%)` background, gold `hsl(45 80% 50%)` primary, crimson accents
- Font: Cinzel for headings, Inter for body

## Gotchas

- Codegen must be re-run after changing `lib/api-spec/openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- Admin key is `detective123` — passed as `?adminKey=detective123` query param to all admin endpoints
- OpenAI integration uses `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY` env vars (Replit managed)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
