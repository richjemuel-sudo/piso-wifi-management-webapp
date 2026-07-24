# Admin login — setup

## Backend

```bash
npm i bcryptjs jsonwebtoken
npm i -D @types/bcryptjs @types/jsonwebtoken tsx
```

**1. Add the User model** — paste `prisma/schema-addition.prisma` into your
existing `prisma/schema.prisma`, then:

```bash
npx prisma migrate dev --name add_user
```

**2. Add to `.env`:**

```
JWT_SECRET=<paste a long random string here>
JWT_EXPIRES_IN=12h
SEED_ADMIN_PASSWORD=<your first-login password>
```

Generate a secret with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**3. Add both keys to `src/config/env.ts`** so startup fails loudly if they're missing:

```ts
JWT_SECRET: z.string().min(32),
JWT_EXPIRES_IN: z.string().default("12h"),
```

**4. Create the admin account:**

```bash
npx tsx prisma/seed.ts
```

**5. Mount the routes in `src/app.ts`:**

```ts
import { authRoutes } from "./modules/auth/auth.routes";
app.use("/api/auth", authRoutes);
```

**6. Protect the existing routes** — add `requireAuth` so the dashboard API
isn't public:

```ts
import { requireAuth } from "./middleware/requireAuth";

app.use("/api/vouchers", requireAuth, voucherRoutes);
app.use("/api/stats", requireAuth, statsRoutes);
```

⚠️ One exception: the NodeMCU posts to `/api/vouchers` and has no token.
Either give the device its own API key, or keep POST public and protect only
GET. See "Device auth" below.

## Frontend

```bash
npm i lucide-react
```

Copy `src/context/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`,
`src/pages/Login.tsx`, and replace `src/App.tsx` and `src/components/Header.tsx`.

Put your logo at `src/assets/Richly.png`.

If TypeScript complains about the PNG import, add to `src/vite-env.d.ts`:

```ts
declare module "*.png";
```

## Device auth

The vendo can't log in like a human. Simplest fix — a shared key:

```
DEVICE_API_KEY=<another random string>
```

Middleware that accepts either a JWT or the device key, applied to POST
/api/vouchers only. Then in the sketch:

```cpp
http.addHeader("X-Device-Key", DEVICE_KEY);
```

## Notes

- Token lives in `localStorage`. Simple and works, but readable by any script
  on the page — an httpOnly cookie is stricter if this ever goes public.
- Logout is client-side only. Server-side revocation needs a token blocklist,
  which isn't worth the complexity at this scale.
- Change the seeded password after first login.