# Changelog

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
