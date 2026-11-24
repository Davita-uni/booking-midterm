# Changelog

## 0.13.1 — Simpler sign-up

- Sign up is now one simple form that creates an attendee account (no account-type step). Most users are attendees.
- Organizers use a quieter link under the form, "Apply for an organizer account" (`/register?as=organizer`), with three steps: Organization → Your details → Done.
- The step headers are buttons, so users can jump back to an earlier step; a missing organization sends them back to step 1 with the error.

## 0.13.0 — Request replies and account menu

- Requests keep a history of admin replies (new `request_replies` table). Every save can add a new reply, e.g. one when moving to Work in progress and another when moving to Completed. Each reply shows the admin, date and time, and the status it set.
- New status **Cancelled** (tab on the admin page; struck-through label).
- Requests show the date and time they were sent (24-hour).
- Databases from 0.11–0.12 are upgraded automatically on start: the requests table is rebuilt with the new status and the old single reply moves into `request_replies`.
- The header button is now called **Account** (was "My account"). Menu order: My profile, My events, My requests; the menu is as wide as its content, with the same padding left and right.

## 0.12.5 — Notification tweaks

- The bell checks for new notifications every 10 seconds (was 30).
- New wording when a booked event changes: “Event name”, which you booked, was updated. Click to view new details.
- A "was cancelled" notification now opens a greyed-out page with the event's title, date and venue and a "cancelled by the organizer" banner (the notification link carries those details, since the event itself is deleted).
- Admins are notified when a new organizer signs up and waits for approval.
- The event page shows the organizer's organization instead of the person's name.

## 0.12.4 — 24-hour time

- The event form's date and time is now a date picker plus a 24-hour time list (00:00 … 23:45 in 15-minute steps). The browser's combined date-and-time input showed AM/PM on English systems.
- "Choose a time" error when a date is picked without a time (checked on the server).
- Fields in a two-column form row line up at the top.

## 0.12.3 — Message style

- Error, success and info messages no longer look like input fields: no full border, a thick coloured bar on the left, a round icon (!, ✓, i), bold text and a stronger tint.

## 0.12.2 — 15-minute event times

- The event form's date and time picker offers minutes in 15-minute steps (:00, :15, :30, :45).
- The server rejects other minutes with a field error, so the rule holds even without the form.

## 0.12.1 — Pending organizers can book

- Organizers waiting for approval now have attendee rights: they can book and cancel seats, and their bookings show up under My profile → Events attended and with the check icon in event lists. Attendee accounts never need approval, so neither does booking.
- Organizer actions (creating events, attendee lists, requests) still wait for approval (`403 account_pending`).
- Server: booking routes use `requireSession`; `optionalAuth` also recognises pending accounts.
- The account status page says they can book events in the meantime.

## 0.12.0 — Notifications

- New `notifications` table and a bell in the header with the unread count, a dropdown list, "Mark all as read", and links to the related page. Checks every 30 seconds and on every page change.
- Attendees (anyone with a seat): notified when an event they booked is edited (lists what changed) or cancelled.
- Organizers: notified when the admin replies to or changes the status of their request, and when one of their events becomes fully booked.
- Admins: notified when an organizer sends a new request.
- Organizers waiting for approval: "You have been accepted as Organizer. Welcome to DoorList!" when approved.
- API: `GET /api/notifications`, `POST /api/notifications/:id/read`, `POST /api/notifications/read-all` (only your own).
- Seed adds a few notifications so the bell isn't empty in the demo.

## 0.11.0 — Requests to admins

- New `requests` table (organizer → admins) with status `new` / `in_progress` / `completed` and an admin reply.
- Organizers: "My requests" in the My account menu lists their requests with status (New, Work in progress, Completed) and the admin's reply. "Add new request" opens an email-like form (To, From, Subject, Request).
- Admins: "Requests" in the My account menu, tabs by status (New count in red), reply and change status per request.
- API: `GET/POST /api/requests`, `PATCH /api/requests/:id` (admin only), validated on the server. Attendees get `403`.
- Seed: three sample requests (completed with reply, in progress with reply, new).

## 0.10.0 — Light and dark theme

- New light theme (warm paper background, darker amber for contrast). "Stage night" stays as the dark theme.
- First visit follows the system setting: dark system → dark, light system → light (light if unknown).
- Moon/sun button in the header switches the theme; the choice is saved in `localStorage` and wins over the system. Switching back to the system's theme removes the saved choice.
- The theme is applied by a small script in `index.html` before React starts, so there is no flash of the wrong theme.
- All hard-coded colours replaced by theme variables (`color-mix` for tinted backgrounds).

## 0.9.2 — Past event tag

- The tag on a past event's page now reads "Past event" (the "· read-only" part was removed). Past events stay read-only.

## 0.9.1 — Event icons and more past events

- Seed now has eight past events (September–November 2026) across all venues and categories, with realistic attendee lists, like the upcoming ones.
- Next to an event's title (in the lists and on the event page): a green check with the tooltip "You have booked this event", and a green organizer icon with the tooltip "You are organizer of this event".
- `GET /api/events` returns `is_registered` and `is_organizer` for the logged-in user; the event detail returns `is_organizer`.

## 0.9.0 — Past events

- Events page title is now a switch: "Upcoming events / Past events". The selected one is the big title, the other is smaller after the slash. The choice is kept in the address (`/?when=past`), so reload and Back keep it.
- `GET /api/events?when=past` lists events that already took place, newest first. Search and category filter work for both.
- Past events are read-only: no Edit/Delete buttons, no booking or cancelling, and the server refuses changes with `409`. The organizer (and admin) can still see the attendee list.
- Past rows show "N attended"; the event page shows a "Past event · read-only" tag.
- Seed adds three past events with attendees.
- The role label in the account menu is now centred on the letters of the name (trimmed text boxes), so it lines up exactly.

## 0.8.0 — My profile and organizer bookings

- My account menu: "Account details" removed; "My profile" opens the overview page.
- My profile page shows the account facts and two lists: **Events organized** (organizers) and **Events attended** (bookings). "Edit profile" opens the edit form at `/account/profile/edit`.
- Organizers can book seats at other organizers' events; booking their own event is refused (`403`). Organizing an event never adds it to Events attended.
- Admin accounts can't book seats; organizers waiting for approval can't either.
- `GET /api/account` returns `organized` and `attended` lists. Seed: Nino has booked Giorgi's Postgres clinic.
- The My events / My tickets buttons were removed from the profile page.

## 0.7.2 — My events in the account menu

- For approved organizers, "My events" moved from the top navigation into the My account dropdown (above My profile).

## 0.7.1 — Read-only email

- My profile shows the email read-only (it is the login).
- `PUT /api/account/profile` no longer changes the email and answers `400` if a different one is sent.
- Database trigger `users_email_readonly` aborts any `UPDATE` that changes `users.email`.
- The role label in the account menu is vertically centred with the name.

## 0.7.0 — My account

- Header: one "My account" dropdown instead of separate name, label and Log out. It shows the name with an Admin / Organizer / Pending tag, then My profile, Account details and Log out (closes on outside click or Escape).
- My profile page: edit name, email and organization (organizers); change password with the current password and a repeat field. A password change ends all sessions and asks to log in again.
- Account details page: account type, status, member since, bookings or events count.
- API: `GET /api/account`, `PUT /api/account/profile`, `PUT /api/account/password`, all validated on the server.
- Attendee list on the event page is sortable by name, email and booking date (click a header to switch direction). The # column keeps counting 1, 2, 3… from the top. On phones the sort buttons sit above the cards.

## 0.6.5 — Header role label

- The role label next to the user's name is shown only for Admin and Organizer accounts (and "Pending" for organizers awaiting approval). Attendees, the default account type, have no label.

## 0.6.4 — "All" tab

- The "All" tab on the Organizers page lists active and suspended organizers only. Sign-ups waiting for approval appear only under "Waiting for approval".

## 0.6.3 — Role label colour

- The role label next to Log out is green for every role (Admin was red, which read like a warning). The "Pending" label for organizers awaiting approval stays amber.

## 0.6.2 — Approval tab

- Organizers page tabs: Active, Suspended, All on the left; "Waiting for approval" on its own on the right.
- The waiting count is red while anyone is waiting, since it needs action. On phones the tab comes first.

## 0.6.1 — Account status page for pending organizers

- Pending organizers are logged in after signing up or logging in, instead of being turned away.
- New "Account status" page: shows the approval status, the help center number, and checks for approval every 30 seconds or on "Check status now". After approval it links to creating the first event.
- While pending, any other organizer page redirects to the status page; public event pages stay browsable.
- Server: `requireSession` (any non-suspended account) for `/auth/me` and `/auth/logout`; `requireAuth` answers `403 account_pending` for pending accounts.

## 0.6.0 — Organizer approval

- Sign-up is now 3 steps: account type, details, done. Organizers also give an organization or project name.
- New organizer accounts are `pending`: no token, and login returns `403` with a "waiting for approval" message and the help center number (+995 555 XX XX XX).
- Admin "Organizers" page: approve or reject sign-ups, suspend and reactivate organizers (tabs with counts, confirmation before reject/suspend).
- Suspending logs the organizer out immediately (`token_version` + 1); `requireAuth` only accepts active accounts.
- `users.status` and `users.organization` columns; older databases are upgraded automatically on start.
- Seed adds two pending organizers for the demo.

## 0.5.1 — Select arrow

- Dropdown arrow now sits 12px from the right edge, the same distance as the text from the left (custom arrow instead of the browser default).

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
