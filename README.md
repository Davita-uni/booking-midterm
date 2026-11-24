# Doorlist — Event Booking Platform

Interim MVP for Web Programming (Team 02). Organizers publish events at
venues around Tbilisi, attendees book a seat, and admins look after the
venue and category lists.

**Design (Figma):** _link added once the Figma file is shared_

## What each role can do

| Role      | Can do |
| --------- | ------ |
| Attendee  | Browse and search events, book a seat, cancel a booking, see "My tickets" |
| Organizer | After admin approval: create events, edit and delete **only their own** events, see who booked their events, book seats at **other organizers'** events |
| Admin     | Approve, reject, suspend and reactivate organizers; manage venues and categories; edit or delete any event; see any attendee list |

Roles are checked on the server for every request (`requireAuth` +
`requireRole` middleware and an ownership check for events). The React app
only hides buttons; it is not what protects the data.

## Signing up

Sign-up has three steps: **1. Account type → 2. Your details → 3. Done**.

- **Attendee** ("Book events"): name, email, password. The account works right away.
- **Organizer** ("Run events"): name, organization or project, email, password.
  The account is created as **pending**. The organizer is logged in and lands
  on an **Account status** page that says an admin has to approve the account,
  asks them to wait, and gives the help center number (+995 555 XX XX XX) to
  call in case of delay. The page checks the status every 30 seconds (or with
  "Check status now"), so there's no need to log in again. Logging in later
  while still pending opens the same page.

The admin opens **Organizers** in the menu. The tabs are Active, Suspended and
All (active + suspended) on the left, and **Waiting for approval** on its own on the right, with the
number of waiting sign-ups in red. New sign-ups are listed there, where the admin can **Approve** or **Reject** them.
Once approved, the status page switches to "You're approved" and the organizer
can create events. Active organizers can be **Suspended**, which logs them out
at once and blocks login (the login page explains why). Suspended organizers
can be **Reactivated**.

## My account

Logged-in users open **My account** in the top right corner. The menu shows
their name (with an Admin, Organizer or Pending tag) and:

- **My events** (approved organizers only): the organizer dashboard.
- **My profile**: email, account type, status, organization, member since, and
  two lists. Organizers see **Events organized** and **Events attended**.
  Attendees see **Events attended**. Booking a seat adds the event to Events
  attended. An organizer's own events are never added there, and the server
  refuses a booking at your own event.
  **Edit profile** opens the form for the name (and organization) and the
  password. The email is read-only: it is the login and can't be changed (the
  API refuses it and a database trigger blocks any `UPDATE` of `users.email`).
  Changing the password logs the user out everywhere.
- **Log out**.

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
copy .env.example .env   # macOS/Linux: cp .env.example .env
npm run seed             # creates (or resets) server/data/doorlist.db with test data
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

If `.env` is missing, the server falls back to the values in `.env.example`
so it still starts; put your own `JWT_SECRET` in `.env` for anything real.
The real `.env` is ignored by git.

### Showing a forbidden action

With the API running, in another terminal:

```bash
cd server
npm run demo:forbidden
```

It logs in as organizer Giorgi and attendee Ana and calls the API directly,
skipping the React app. The server answers `403` when Giorgi tries to edit,
delete or read the attendee list of Nino's event, `403` when Ana tries to
create an event or a venue, and `401` without a token.

In the browser: log in as `giorgi.lomidze@doorlist.test` and open
"Late Jazz at the Courtyard". There are no Edit/Delete buttons, and opening
`/events/1/edit` directly shows "You can only edit events that you organize".

## Test accounts

Created by `npm run seed`:

| Role      | Email                     | Password        |
| --------- | ------------------------- | --------------- |
| Admin     | `admin@doorlist.test`     | `Admin123!`     |
| Organizer | `organizer@doorlist.test` | `Organizer123!` |
| Attendee  | `attendee@doorlist.test`  | `Attendee123!`  |

Two organizer sign-ups are waiting for approval, so the approval screen isn't
empty: `levan.kiknadze@doorlist.test` and `keti.mamaladze@doorlist.test`
(both `Organizer123!`). Logging in as one of them opens the account status
page until the admin approves it.

A second active organizer, `giorgi.lomidze@doorlist.test` (`Organizer123!`), owns
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
- Organizer accounts have a `status`: `pending` → `active` (approved) ⇄ `suspended`.
  Pending organizers get a session, but the server only lets them call
  `/api/auth/me` and `/api/auth/logout` (`requireSession`); everything else
  answers `403 account_pending` (`requireAuth`). Suspended accounts can't log in.

## Database

SQLite file at `server/data/doorlist.db` (ignored by git). The schema is in
[`server/db/schema.sql`](server/db/schema.sql) and runs automatically when the
server starts. `npm run seed` resets the data.

| Table           | Key columns                                                       |
| --------------- | ----------------------------------------------------------------- |
| `users`         | `id` PK, `email` unique, `role` (admin / organizer / attendee), `status` (pending / active / suspended), `organization` |
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
| GET    | `/api/events`        | public    | Upcoming events, or past ones with `?when=past` (`?q=`, `?category=`) |
| GET    | `/api/events/mine`   | organizer | Own events with booking counts |
| GET    | `/api/events/:id`    | public    | One event                |
| POST   | `/api/events`        | organizer | Create an event          |
| PUT    | `/api/events/:id`    | owner organizer, admin | Update an event |
| DELETE | `/api/events/:id`    | owner organizer, admin | Delete an event |
| POST   | `/api/events/:id/registrations`    | attendee, organizer (not own event) | Book a seat |
| DELETE | `/api/events/:id/registrations/me` | attendee, organizer | Cancel own booking |
| GET    | `/api/events/:id/registrations`    | owner organizer, admin | Attendee list |
| GET    | `/api/registrations/mine`          | attendee, organizer | Own bookings |
| GET    | `/api/account`                     | logged in | Own account with events organized and attended |
| PUT    | `/api/account/profile`             | logged in | Update name, organization (email is read-only) |
| PUT    | `/api/account/password`            | logged in | Change password (needs the current one) |
| GET    | `/api/admin/organizers`            | admin | Organizers with status and event count |
| PATCH  | `/api/admin/organizers/:id`        | admin | Approve, suspend or reactivate (`{ status }`) |
| DELETE | `/api/admin/organizers/:id`        | admin | Reject a pending sign-up |

## Validation and UX

- All input is checked on the server (`server/utils/validate.mjs`); the form
  shows each message under its field with a red border.
- Deleting a venue, category or event and cancelling a booking ask for confirmation first.
- Every list has a loading, empty and error state.
- The events page switches between **Upcoming events / Past events**. Past
  events are read-only: no booking, cancelling, editing or deleting (the server
  answers `409`), but organizers still see who attended.
- In event lists and on the event page, a green check means "You have booked
  this event" and a green person-with-star icon means "You are organizer of
  this event" (tooltips on hover).
- The attendee list can be sorted by name, email or booking date; the # column always counts from 1.
- Layout works from 360px phones to desktop (tables turn into cards on small screens).

## Versions

See [CHANGELOG.md](CHANGELOG.md). Each version was added as its own pull request:

| Version | Pull request |
| ------- | ------------ |
| 0.0.1 | Project setup (Express, React + Vite, design tokens) |
| 0.0.2 | SQLite schema and seed data |
| 0.1.0 | Registration, login, logout, roles |
| 0.2.0 | Venues and categories CRUD (admin) |
| 0.3.0 | Events CRUD with organizer ownership |
| 0.4.0 | Bookings, capacity limit, attendee list |
| 0.5.0 | Forbidden-action demo, README, polish |
| 0.5.1 | Dropdown arrow spacing |
| 0.6.0 | 3-step sign-up, organizer approval by admin |
| 0.6.1 | Pending organizers stay logged in with an account status page |
| 0.6.2 | Organizers page: "Waiting for approval" tab on the right with a red count |
| 0.6.3 | Role label in the header is green for every role |
| 0.6.4 | "All" tab no longer includes sign-ups waiting for approval |
| 0.6.5 | No role label in the header for attendees |
| 0.7.0 | "My account" menu, profile editing, sortable attendee list |
| 0.7.1 | Email is read-only; role label aligned with the name |
| 0.7.2 | "My events" moved into the My account menu |
| 0.8.0 | One My profile page (events organized / attended); organizers can book other events |
| 0.9.0 | Upcoming / Past events switch; past events read-only |
| 0.9.1 | More past events in the seed; booked / organizer icons with tooltips |
