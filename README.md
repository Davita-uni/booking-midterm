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
npm run seed      # creates server/data/doorlist.db with test data
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

## Database

SQLite file at `server/data/doorlist.db` (ignored by git). The schema is in
[`server/db/schema.sql`](server/db/schema.sql) and runs automatically when the
server starts. `npm run seed` resets the data.

| Table           | Key columns                                                       |
| --------------- | ----------------------------------------------------------------- |
| `users`         | `id` PK, `email` unique, `role` (admin / organizer / attendee)   |
| `categories`    | `id` PK, `name` unique                                            |
| `venues`        | `id` PK, `name` unique, `address`, `capacity`                    |
| `events`        | `id` PK, `venue_id` FK, `category_id` FK, `organizer_id` FK → users |
| `registrations` | `id` PK, `event_id` FK, `user_id` FK, unique (`event_id`, `user_id`) |

One-to-many relations: an organizer has many events, a venue has many
events, a category has many events, and an event has many registrations.
All queries use prepared statements with `?` parameters.

## Versions

See [CHANGELOG.md](CHANGELOG.md). Each version was added as its own pull request.
