# Doorlist — Event Booking Platform

Interim MVP for Web Programming (Team 02). Organizers publish events at
venues around Tbilisi, attendees book a seat, and admins look after the
venue and category lists.

## Stack

| Part     | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | React 19 + Vite                           |
| Backend  | Node.js + Express 5 (REST API)            |
| Database | SQLite through Node's built-in `node:sqlite` |

## Project structure

```
client/   React app (Vite dev server on http://localhost:5173)
server/   Express REST API (http://localhost:3000)
```

## How to run

Requirements: Node.js 22.13 or newer.

Open two terminals.

```bash
# terminal 1 — API
cd server
npm install
npm run dev
```

```bash
# terminal 2 — React app
cd client
npm install
npm run dev
```

Then open http://localhost:5173. The Vite dev server forwards `/api`
requests to the Express server.

## Versions

See [CHANGELOG.md](CHANGELOG.md). Each version was added as its own pull request.
