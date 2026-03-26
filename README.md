# Presight exercise

Monorepo with a **Node/Express** API (`server`) and a **React + Vite** client (`client`).

## Requirements

- **Node.js** 20+ (LTS recommended)
- **Yarn** classic (v1), e.g. `npm install -g yarn`

## Run everything (2 commands)

From the repository root:

```bash
yarn
yarn dev
```

This installs dependencies for all workspaces and starts:

| Service | URL | Notes |
|--------|-----|--------|
| **API** | [http://localhost:3000](http://localhost:3000) | REST + Socket.IO (`/ws`) |
| **Client** | [http://localhost:5173](http://localhost:5173) | Vite dev server; `/api` and `/ws` are **proxied** to port 3000 |

Use the app in the **browser at port 5173** so API calls and websockets go through the Vite proxy.

### Optional: run services separately

```bash
yarn dev:server   # API only (port 3000)
yarn dev:client   # Vite only (port 5173)
```

## Root scripts

| Script | Purpose |
|--------|---------|
| `yarn` | Install dependencies (workspaces: `client`, `server`) |
| `yarn dev` | API + client in one terminal (watch mode) |
| `yarn build` | TypeScript build for server + production build for client |
| `yarn start` | Run compiled API (`server/dist`) — run `yarn build` first |
| `yarn preview` | Serve the built client (after `yarn build`) |

## Configuration

- **API port:** defaults to `3000`. Override with env var `PORT` (see `server` — `dotenv` is supported if you add a `.env` file).
- **Client dev proxy:** configured in `client/vite.config.ts` (`/api`, `/ws`, `/health` → `http://localhost:3000`).

## Project layout

```
presight-execise/
├── client/     # React app (Vite)
├── server/     # Express + MongoDB (in-memory for local dev)
├── package.json
└── README.md
```

## Production-style run (after build)

```bash
yarn build
yarn start          # API on PORT (default 3000)
yarn preview        # in another terminal — static client, or host client/dist behind any static server
```

For a single public origin in production, serve `client/dist` and reverse-proxy `/api` and `/ws` to the Node server.
