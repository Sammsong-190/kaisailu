# SCWIS Fullstack

**SCWIS** (Student / Campus Wellness Information System) is a full-stack app for campus mental-health and case workflows: a **React + Vite** front end and an **Express + Prisma + SQLite** API, with **student**, **counselor**, and **admin** roles plus **JWT** authentication.

## Stack

| Layer    | Technology                                      |
|----------|--------------------------------------------------|
| Frontend | React 18, React Router, Vite 5, Recharts         |
| Backend  | Node.js 18+, Express, Prisma, SQLite             |
| Auth     | JWT, bcrypt                                      |

## Requirements

- [Node.js](https://nodejs.org/) **≥ 18**

## Quick start

Run these commands from `scwis-fullstack`:

```bash
# 1. Install root (concurrently) and client/server dependencies
npm install
npm run install:all

# 2. Server env (when .env does not exist yet)
cp server/.env.example server/.env
# Edit DATABASE_URL and JWT_SECRET in server/.env as needed

# 3. Create DB tables and seed initial accounts (skipped if emails already exist)
npm run db:push --prefix server
npm run db:seed --prefix server

# 4. Start API (8788) and dev server (5173) together
npm run dev
```

Open <http://localhost:5173>. In dev mode, Vite proxies `/api` to `http://127.0.0.1:8788`.

### Seed accounts

These are created only when that email address is not yet in the database. The seeded student tied to **`S1001`** is handy for Messages and student flows:

| Role      | Email                        | Password        | Notes                                    |
|-----------|------------------------------|-----------------|-------------------------------------------|
| Admin     | `admin@campus.local`         | `Admin123!`     | Imports roster, admin tooling             |
| Student   | `student@campus.local`       | `Student123!`   | Linked roster ID **`S1001`**              |
| Counselor | `counselor@campus.local`   | `Counselor123!` | Counseling desk and messaging             |

Rotate **`JWT_SECRET`** and change passwords before production.

## Root scripts (`package.json`)

| Command               | Purpose                                                |
|-----------------------|--------------------------------------------------------|
| `npm run install:all` | Install `server` and `client` deps                     |
| `npm run dev`         | API (`node --watch`) + `vite` in parallel               |
| `npm run build`       | Build static assets → `client/dist`                    |
| `npm run start`       | Production API only (serve the built UI yourself)       |

### Server (`server/`)

| Command            | Purpose                              |
|--------------------|--------------------------------------|
| `npm run dev`      | Restart on file changes               |
| `npm start`        | Production entry                       |
| `npm run db:push`  | Push `schema.prisma` to SQLite        |
| `npm run db:seed`  | Run `prisma/seed.js` (optional seeds) |

### Client (`client/`)

| Command            | Purpose                                              |
|--------------------|------------------------------------------------------|
| `npm run dev`      | Vite dev server (**5173**)                           |
| `npm run build`    | `vite build`                                         |
| `npm run preview`  | Preview production build (**4173**, `/api` proxied)  |

## Layout

```
scwis-fullstack/
├── client/          # React app (src/main.jsx, src/App.jsx)
├── server/          # Express API (src/index.js)
│   ├── prisma/      # schema & seed
│   └── .env.example
└── package.json     # root scripts & concurrently
```

## API & health

- Health: `GET /api/health` → `{ "ok": true }`
- Default API port: **8788** (override with **`PORT`**)

## Deploying the frontend (Vercel)

`vercel.json` runs `npm ci` and `npm run build` under **`client/`** and publishes **`client/dist`**.

In **Vercel → Project → Settings → Environment Variables** (Production / Preview as needed):

| Name                 | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| `VITE_API_BASE_URL`  | Base URL of your deployed Express app, **no trailing slash**, e.g. `https://scwis-api.onrender.com` |

Redeploy after saving (the value is baked in at `vite build` time).

If it is unset, the browser calls `/api` on the static host and you may get HTML instead of JSON (`Unexpected token '<'`).

See `client/.env.example`. For local dev, leave it unset and use root **`npm run dev`** for the `/api` proxy.

**Note:** Host **Express + Prisma** separately (e.g. [Render](https://render.com/), Railway). The server uses `cors({ origin: true })` for browser clients.

### Railway / Railpack

The repo includes **`railpack.json`**: after root **`npm ci`**, install runs **`npm ci --prefix client`** and **`npm ci --prefix server`** so `vite` and server deps are present (see [Railpack config](https://railpack.com/config/file)).

**Railway — backend variables (required for Prisma / login)**

On the **Express** service → **Variables**:

| Name            | Example |
|-----------------|---------|
| `DATABASE_URL`  | `file:./dev.db` (same idea as `server/.env.example`; SQLite file under `server/prisma/`) |
| `JWT_SECRET`    | Long random string (not the sample in the repo) |

Redeploy. **`npm start --prefix server`** runs **`prisma db push`** → **`prisma/seed.js`** (creates initial admin if missing) → starts the API. Custom start commands must include equivalent steps or tables will be missing.

If you still see **table `User` does not exist**, confirm the start command, `DATABASE_URL`, and redeploy.

Initial admin (only if that email is absent): `admin@campus.local` / `Admin123!`.

Without a **Volume**, SQLite can be wiped on container rebuild; use a volume or **PostgreSQL** for persistence.

### Error: “Backend returned HTML, not JSON…”

The client expected JSON but received a static page, or the API is not running.

| Situation | Fix |
|-----------|-----|
| Only ran **`npm run dev`** inside **`client/`** | Run **`npm run dev`** from the **repo root** so Vite (5173) and Express (8788) both start. |
| `npm run preview` / port **4173** | In another terminal, run **`npm run dev --prefix server`** first, then preview. |
| Deployed on **Vercel / static hosting** | Deploy a real **HTTPS** Express API; set **`VITE_API_BASE_URL`** (no trailing slash) and redeploy. |

Sanity check: `GET /api/health` should return JSON, e.g. `{"ok":true}` (often `http://127.0.0.1:8788/api/health` locally).

## Production checklist

1. Use a strong, unique **`JWT_SECRET`**, not the sample value.
2. Point **`DATABASE_URL`** at your database and run **`prisma db push`** or your migration process.
3. After `vite build`, serve `client/dist` from your CDN/static host or the same Node process (this repo favors the dev proxy; wire production hosting as you prefer).
4. Where **`NODE_ENV=production`** + `npm ci` omits devDependencies, `vite` can be missing—we keep **Vite** and **`@vitejs/plugin-react`** in **`client`** `dependencies` to avoid **`vite: not found`**.

## License

Unless stated otherwise in the repo, follow the authors’ chosen terms.
