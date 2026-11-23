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

## Test accounts

Created by `npm run seed`:

| Role      | Email                     | Password        |
| --------- | ------------------------- | --------------- |
| Admin     | `admin@doorlist.test`     | `Admin123!`     |
| Organizer | `organizer@doorlist.test` | `Organizer123!` |
| Attendee  | `attendee@doorlist.test`  | `Attendee123!`  |

A second organizer, `giorgi.lomidze@doorlist.test` (`Organizer123!`), owns
some of the events. It is useful for showing that one organizer can't change
another organizer's event.

## Authentication

- Passwords are hashed with bcrypt (`bcryptjs`, 10 rounds) and never sent back.
- Login returns a JWT that the client sends as `Authorization: Bearer <token>`.
- Every protected request loads the user from the database, so role changes
  apply immediately.
- Logout increases the user's `token_version`, so the old token stops working
  on the server too, not only in the browser.
- Sign-up allows the attendee and organizer roles. Admin accounts come only from the seed.

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

## API

All responses are JSON. Validation errors return `400` with
`{ message, errors: { field: "message" } }`.

| Method | Path                 | Access    | Description             |
| ------ | -------------------- | --------- | ----------------------- |
| POST   | `/api/auth/register` | public    | Create an account       |
| POST   | `/api/auth/login`    | public    | Log in, returns a token |
| GET    | `/api/auth/me`       | logged in | Current user            |
| POST   | `/api/auth/logout`   | logged in | End the session         |
| GET    | `/api/venues`        | public    | List venues             |
| GET    | `/api/venues/:id`    | public    | One venue               |
| POST   | `/api/venues`        | admin     | Create a venue          |
| PUT    | `/api/venues/:id`    | admin     | Update a venue          |
| DELETE | `/api/venues/:id`    | admin     | Delete an unused venue  |
| GET    | `/api/categories`    | public    | List categories         |
| POST   | `/api/categories`    | admin     | Create a category       |
| PUT    | `/api/categories/:id`| admin     | Rename a category       |
| DELETE | `/api/categories/:id`| admin     | Delete an unused category |
| GET    | `/api/events`        | public    | Upcoming events (`?q=`, `?category=`) |
| GET    | `/api/events/mine`   | organizer | Own events with booking counts |
| GET    | `/api/events/:id`    | public    | One event                |
| POST   | `/api/events`        | organizer | Create an event          |
| PUT    | `/api/events/:id`    | owner organizer, admin | Update an event |
| DELETE | `/api/events/:id`    | owner organizer, admin | Delete an event |
| POST   | `/api/events/:id/registrations`    | attendee | Book a seat |
| DELETE | `/api/events/:id/registrations/me` | attendee | Cancel own booking |
| GET    | `/api/events/:id/registrations`    | owner organizer, admin | Attendee list |
| GET    | `/api/registrations/mine`          | attendee | Own bookings |

## Versions

See [CHANGELOG.md](CHANGELOG.md). Each version was added as its own pull request.
