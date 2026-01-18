# MVP Quick Notes

## Quick Start
```bash
pnpm install && cd packages/shared && pnpm build
cd ../apps/api && pnpm db:push && pnpm db:seed
cd ../.. && pnpm dev
```

## Auth & Admin
- Set `ADMIN_EMAIL` in `apps/api/.env` → Run seed → Admin promoted
- `NEXTAUTH_SECRET` must match in both API + Web .env files
- Admin can: create sources, trigger ingestion, manage featured

## Ingestion
- **Local**: `cd apps/api && pnpm ingest`
- **Render Cron**: `node dist/scripts/cron-ingest.js` (every 30 min)
- Only fetches active sources, tracks `lastIngestedAt` + `lastError`

## Sources
- **4 Working Fantasy Sources**: FantasySP NFL, RotoWire NFL, Draft Sharks (Shark Bites + Injury)
- **2 Placeholder Sources**: ESPN, Hacker News (can disable for fantasy-only)
- Disable broken sources: `pnpm exec tsx src/scripts/disable-broken-sources.ts`

## Known Issues
- In-memory rate limiter (not multi-instance safe - use Redis for scale)
- Render free tier: API sleeps after 15 min, PostgreSQL 90-day limit

## Key Files
- `apps/api/src/services/ingestion.service.ts` - Content fetching
- `apps/api/src/scripts/cron-ingest.ts` - Standalone cron
- `apps/web/src/lib/auth.ts` - Auth.js config
- `apps/api/src/middleware/auth.ts` - JWT + admin middleware
