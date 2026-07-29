# PisoWiFi Management System

A full-stack management platform for a coin-operated WiFi vending machine (*piso wifi* — a common small business in the Philippines where customers insert coins to buy internet access).

Insert a coin → a voucher is created and the customer is connected → the sale appears live on an admin dashboard. The system spans **embedded hardware, a Node/TypeScript backend, a MikroTik router API, and a React dashboard** — a coin dropped into the machine flows all the way through to a revenue chart with no manual steps.

> **Status:** Working prototype. The hardware coin-reporting path is validated on a real NodeMCU (ESP8266); the RouterOS integration is validated against MikroTik CHR. A browser-based coin simulator is included so the full transaction flow can be demonstrated without physical hardware.

<!-- GIF/video -->
<img width="1152" height="648" alt="Image" src="https://github.com/user-attachments/assets/66f65866-572b-4b60-8e4c-d1fee84b93ef" />

<img width="1341" height="633" alt="Image" src="https://github.com/user-attachments/assets/073ed9ae-e7d9-4f2c-bee8-d9e017c79cae" />

<img width="1347" height="639" alt="Image" src="https://github.com/user-attachments/assets/bd13705c-0cc8-469a-a4f7-7f8ace7ed21a" />
---

## What it does

- **Coin → internet, automatically.** A coin acceptor wired to a NodeMCU reports each coin over HTTP. The backend converts it to a time-limited voucher and logs the customer in via the MikroTik hotspot API — the customer never types a code.
- **Customer portal.** A captive-portal-style page showing a live countdown of remaining time, coin insertion, and voucher redemption.
- **Admin dashboard.** Live sales totals, a sales chart (hourly / daily / 30-day views), active sessions, and a searchable, paginated voucher log with delete.
- **Authentication.** JWT-based admin login; the dashboard API is protected, the hardware authenticates with a device key, and the customer portal is public by design.
- **Anti-sharing.** Vouchers are bound to the customer's MAC address, so a code can't be reused on another device.

---

## Architecture

```
  Coin acceptor
       │ pulse
       ▼
   NodeMCU (ESP8266) ──HTTP + device key──►  Node/Express + TypeScript backend
                                                 │        │
                                                 │        ├── Prisma / SQLite  (vouchers, users, settings)
                                                 │        │
                                                 │        └── MikroTik RouterOS API  (create hotspot user, login, sessions)
                                                 │
                                             React + Vite dashboard  ◄── polls REST API
                                             React customer portal
```

**The design principle:** the backend owns identity and business logic. The NodeMCU is a dumb coin reporter; MikroTik handles routing, bandwidth, and session enforcement; the backend decides who a coin belongs to (via a short-lived "claim" reserved to the customer's MAC) and turns it into a voucher. Each layer does one job, so any piece can be swapped without touching the others.

---

## Tech stack

| Layer | Tools |
|---|---|
| Hardware | NodeMCU (ESP8266), coin acceptor, Arduino/C++ |
| Backend | Node.js, Express, TypeScript, Prisma, SQLite, JWT, Zod |
| Router | MikroTik RouterOS API (`node-routeros`) |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts |

---

## Key engineering decisions

- **Claim + MAC binding.** A customer taps "insert coin," which opens a 30-second claim keyed to their MAC (resolved from MikroTik, never from the browser). Coins credit to the open claim; the resulting voucher is bound to that MAC. This solves the real concurrency problem of one coin slot serving many phones, and prevents code sharing.
- **Coin loss prevention.** The NodeMCU holds coins in memory and retries until the backend confirms receipt, so a dropped WiFi link or a restarting backend never loses a customer's money.
- **Hardware-independent demo.** Every RouterOS call is guarded so the system runs fully on a database alone in development. A coin simulator POSTs to the *same* endpoint the NodeMCU uses, so the software path is exercised end to end without the ESP present.
- **Pause/resume.** Implemented server-side by logging the user out (MikroTik stops counting time while inactive) with an admin-configurable expiry. Requires physical hardware to demonstrate.

---

## Running it locally

**Requirements:** Node 18+, npm.

```bash
# Backend
cd backend
npm install
cp .env.example .env          # fill in the values (see below)
npx prisma migrate dev        # create the SQLite database
npx tsx prisma/seed.ts        # create the admin account
npm run dev                   # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env          # set VITE_DEVICE_KEY to match the backend
npm run dev                   # http://localhost:5173
```

Then:
1. Open the **portal** at `http://localhost:5173/portal`
2. Tap **INSERT COIN**, then use the **coin simulator** (bottom-right) to drop a coin
3. Tap **DONE PAYING** — a countdown starts
4. Open the **dashboard** at `http://localhost:5173`, log in, and watch the sale appear

### Environment

`backend/.env`:
```
PORT=4000
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=12h
SEED_ADMIN_PASSWORD=<your admin password>
DEVICE_API_KEY=<a long random string, shared with the NodeMCU and frontend>
MINUTES_PER_PESO=5
HOTSPOT_PROFILE=plan-1hr
DATABASE_URL="file:./dev.db"
# For real hardware only — the host-only address of the MikroTik router:
MT_HOST=192.168.56.1
MT_PORT=8728
MT_USER=apiuser
MT_PASS=<router api password>
```

`frontend/.env`:
```
VITE_DEVICE_KEY=<same value as backend DEVICE_API_KEY>
```

---

## Hardware setup (optional)

To run with the physical coin machine instead of the simulator:

1. Flash `firmware/pisowifi_vendo.ino` to a NodeMCU, setting your WiFi credentials, the backend URL, and the device key.
2. Wire the coin acceptor's pulse line to `D2`.
3. Point the backend's `MT_HOST` at a MikroTik router running a hotspot with an `api` user and a `plan-1hr` user profile.

The ESP posts each coin to `POST /api/portal/coin` with an `X-Device-Key` header — the identical request the simulator makes.

---

## Project status & scope

This is a portfolio prototype built to demonstrate a complete full-stack + IoT system.

- ✅ Coin reporting validated on real NodeMCU hardware
- ✅ RouterOS API integration validated against MikroTik CHR (Cloud Hosted Router)
- ✅ Full transaction loop demoable via the included simulator
- ⚠️ Wireless captive-portal behavior and pause/resume require a physical MikroTik router to demonstrate, as they depend on live hotspot session state
- ⚠️ Seed credentials and some hardware-status panel values are placeholders — change before any real deployment

---

## License

MIT
