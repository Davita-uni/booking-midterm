# Changelog

## 0.5.0 — Demo and polish

- `npm run demo:forbidden`: calls the API directly as the wrong role and shows the server's `403`/`401` answers.
- README: what each role can do, `.env` setup, demo steps, validation and UX notes.
- Favicon.

## 0.4.0 — Bookings

- Attendees book and cancel seats. Booking runs in a transaction and is refused when the event is full, already started, or already booked (`409`).
- Organizers see the attendee list for their own events; other organizers get `403`.
- Event page shows the booking state (book, sold out, you have a seat, cancel with confirmation).
- "My tickets" page for attendees; "Attendees" shortcut on the organizer dashboard.

## 0.3.0 — Events

- Events CRUD API. Organizers create events; only the event's own organizer (or an admin) can edit or delete it, otherwise `403`.
- Validation: future date, venue and category must exist, seats can't exceed the venue or go below seats already booked.
- Event list with search and category filter, event detail page, create/edit form and an organizer "My events" dashboard.
- Delete asks for confirmation; deleting an event removes its bookings (ON DELETE CASCADE).

## 0.2.0 — Venues and categories (admin)

- CRUD API for venues and categories; only admins can create, edit or delete.
- A venue or category that events still use can't be deleted (409 with a clear message).
- A venue's seats can't go below its largest event; duplicate names are rejected.
- Admin pages with a table, an add/edit form and a confirm dialog before deleting.
- Shared loading, empty and error states; tables turn into cards on phones.

## 0.1.0 — Accounts and roles

- `POST /api/auth/register`, `/login`, `/logout`, `GET /api/auth/me`.
- Passwords hashed with bcrypt; JWT sessions; logout invalidates the token on the server.
- `requireAuth` and `requireRole(...)` middleware for server-side role checks.
- Server-side validation with per-field error messages; consistent JSON error format.
- Login and sign-up pages (attendee or organizer), red field borders with the error under the field.
- Header shows the user's name, role and a red Log out button.

## 0.0.2 — Database

- SQLite schema (`server/db/schema.sql`): users, categories, venues, events, registrations.
- Primary keys, foreign keys, CHECK constraints, unique email and one booking per attendee per event.
- Database module with foreign keys switched on and a `transaction()` helper.
- `npm run seed`: one test account per role plus realistic Tbilisi venues and events (passwords hashed with bcrypt).

## 0.0.1 — Project setup

- Express server with CORS, JSON body parsing, 404 and error handlers.
- React + Vite client with an `/api` proxy to the server.
- "Stage night" design tokens (colours, fonts, spacing) and base layout.
- Small History API router (no extra dependency).
- `.gitignore` and `server/.env.example`.
