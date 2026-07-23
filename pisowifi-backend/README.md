# Piso WiFi Backend

Bridges the NodeMCU coin/voucher machine to a MikroTik hotspot, and serves the API
the React dashboard reads from.

Flow: `coin -> NodeMCU issues code -> POST /api/vouchers -> creates MikroTik hotspot user + saves to DB`

## Prerequisites
- Node 18+
- A MikroTik with a running hotspot, a `plan-1hr` user profile, and an `apiuser` (group `write`)
- The `api` service enabled on port 8728

## Setup
```bash
npm install
cp .env.example .env        # then edit .env with your MikroTik password + pricing
npx prisma migrate dev --name init   # creates the SQLite DB + tables
npm run dev                 # starts on http://localhost:4000
```

## Test (no NodeMCU needed)
```bash
curl -X POST http://localhost:4000/api/vouchers \
  -H "Content-Type: application/json" \
  -d '{"code":"DD4M7X","pesos":7}'
```
Expect `201` and the user appearing under `IP -> Hotspot -> Users` in MikroTik.
List saved vouchers: `GET http://localhost:4000/api/vouchers`

## Structure
```
src/
  config/env.ts          validated environment config (zod)
  db/prisma.ts           Prisma client singleton
  lib/mikrotik.ts        RouterOS API wrapper (create hotspot user)
  middleware/            request validation + central error handler
  modules/vouchers/      routes -> controller -> service -> (mikrotik + db)
  utils/                 time formatting, logger
  app.ts                 express app assembly
  server.ts              entrypoint
prisma/schema.prisma     Voucher + Device models
```

## Next steps
- Point the React dashboard at `GET /api/vouchers` for the sales table
- Add a `/api/devices/heartbeat` endpoint so the NodeMCU reports it's alive
- Swap the SQLite datasource for PostgreSQL when you deploy
