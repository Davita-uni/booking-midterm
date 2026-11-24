// Resets the database and fills it with realistic test data.
// Run with: npm run seed
import bcrypt from "bcryptjs";
import { db, transaction, DB_FILE } from "./index.mjs";

const users = [
  // one test account per role (see README)
  { name: "Tamar Gelashvili", email: "admin@doorlist.test", password: "Admin123!", role: "admin" },
  { name: "Nino Beridze", email: "organizer@doorlist.test", password: "Organizer123!", role: "organizer", organization: "Courtyard Sessions" },
  { name: "Ana Kapanadze", email: "attendee@doorlist.test", password: "Attendee123!", role: "attendee" },
  // extra people so lists are not empty
  { name: "Giorgi Lomidze", email: "giorgi.lomidze@doorlist.test", password: "Organizer123!", role: "organizer", organization: "Tbilisi Dev Community" },
  // organizer sign-ups waiting for admin approval
  { name: "Levan Kiknadze", email: "levan.kiknadze@doorlist.test", password: "Organizer123!", role: "organizer", organization: "Board Game Club Vake", status: "pending" },
  { name: "Keti Mamaladze", email: "keti.mamaladze@doorlist.test", password: "Organizer123!", role: "organizer", organization: "Sololaki Photo Walks", status: "pending" },
  { name: "Luka Tsiklauri", email: "luka.tsiklauri@doorlist.test", password: "Attendee123!", role: "attendee" },
  { name: "Mariam Chikovani", email: "mariam.chikovani@doorlist.test", password: "Attendee123!", role: "attendee" },
  { name: "Saba Javakhishvili", email: "saba.javakhishvili@doorlist.test", password: "Attendee123!", role: "attendee" },
  { name: "Elene Abashidze", email: "elene.abashidze@doorlist.test", password: "Attendee123!", role: "attendee" },
];

const categories = ["Music", "Tech talk", "Workshop", "Theatre", "Food & drink"];

const venues = [
  { name: "Fabrika Courtyard", address: "8 Egnate Ninoshvili St", capacity: 300 },
  { name: "Rustaveli Theatre, Small Stage", address: "17 Shota Rustaveli Ave", capacity: 120 },
  { name: "Impact Hub Tbilisi", address: "8 Ivane Javakhishvili St", capacity: 80 },
  { name: "Wine Factory N1 Cellar", address: "1 Vasil Petriashvili St", capacity: 60 },
  { name: "Biblusi Reading Room", address: "36 Shota Rustaveli Ave", capacity: 50 },
];

// organizer: 1 = Nino (the main test organizer), 2 = Giorgi
const events = [
  {
    title: "Late Jazz at the Courtyard",
    description: "A trio from the Tbilisi Jazz Club plays two sets of standards and new Georgian jazz. Doors at 19:30, the first set starts at 20:00.",
    starts_at: "2026-12-04T20:00", capacity: 150, venue: "Fabrika Courtyard", category: "Music", organizer: 1,
  },
  {
    title: "Frontend Meetup #14: React Server Components",
    description: "Two 25-minute talks on moving a real product to server components, then open Q&A. Bring a laptop if you want to follow the demo.",
    starts_at: "2026-12-09T19:00", capacity: 60, venue: "Impact Hub Tbilisi", category: "Tech talk", organizer: 1,
  },
  {
    title: "Natural Wine Tasting: Kakheti Qvevri",
    description: "Six qvevri wines from small Kakheti producers, introduced by the winemakers. Cheese and bread included.",
    starts_at: "2026-12-12T18:30", capacity: 50, venue: "Wine Factory N1 Cellar", category: "Food & drink", organizer: 1,
  },
  {
    title: "Writing Short Fiction — Saturday Workshop",
    description: "A three-hour workshop on openings and endings. Short exercises, feedback in small groups. Notebook required, laptops optional.",
    starts_at: "2026-12-19T12:00", capacity: 50, venue: "Biblusi Reading Room", category: "Workshop", organizer: 2,
  },
  {
    title: "The Cherry Orchard (in Georgian, English surtitles)",
    description: "A new chamber production of Chekhov's play by a young company. Running time is about two hours with one interval.",
    starts_at: "2026-12-22T19:00", capacity: 110, venue: "Rustaveli Theatre, Small Stage", category: "Theatre", organizer: 2,
  },
  {
    title: "Postgres Performance Clinic",
    description: "Bring a slow query and we will look at it together on the projector. Covers EXPLAIN, indexes and connection pooling.",
    starts_at: "2027-01-14T18:30", capacity: 80, venue: "Impact Hub Tbilisi", category: "Tech talk", organizer: 2,
  },
  {
    title: "Winter Electronic Night",
    description: "Three local DJs, a long night and a proper sound system. 18+ only, ID checked at the door.",
    starts_at: "2027-01-23T22:00", capacity: 280, venue: "Fabrika Courtyard", category: "Music", organizer: 1,
  },
  {
    title: "Khinkali Folding Class",
    description: "Learn to fold khinkali with a chef from Racha, then eat what you made. All ingredients and aprons provided.",
    starts_at: "2027-02-06T13:00", capacity: 60, venue: "Wine Factory N1 Cellar", category: "Food & drink", organizer: 1,
  },
  // already happened, shown under "Past events" (read-only)
  {
    title: "Tbilisi Startup Pitch Night",
    description: "Eight early-stage teams pitched for five minutes each, followed by questions from a panel of local investors.",
    starts_at: "2026-09-25T19:00", capacity: 70, venue: "Impact Hub Tbilisi", category: "Tech talk", organizer: 2,
  },
  {
    title: "Autumn Jazz in the Courtyard",
    description: "An open-air afternoon set to close the summer season, with a guest saxophonist from Batumi.",
    starts_at: "2026-10-10T17:00", capacity: 200, venue: "Fabrika Courtyard", category: "Music", organizer: 1,
  },
  {
    title: "Frontend Meetup #13: Accessibility in Practice",
    description: "Screen readers, focus management and colour contrast, shown on real Georgian websites.",
    starts_at: "2026-11-11T19:00", capacity: 60, venue: "Impact Hub Tbilisi", category: "Tech talk", organizer: 1,
  },
  {
    title: "Rtveli Harvest Supper",
    description: "A long-table dinner after the grape harvest: chacha tasting, mtsvadi from the grill and supra toasts led by a tamada.",
    starts_at: "2026-09-19T19:30", capacity: 60, venue: "Wine Factory N1 Cellar", category: "Food & drink", organizer: 1,
  },
  {
    title: "Hamlet (rehearsed reading)",
    description: "Six actors read the play in a new Georgian translation, followed by a talk with the translator.",
    starts_at: "2026-10-03T19:00", capacity: 110, venue: "Rustaveli Theatre, Small Stage", category: "Theatre", organizer: 2,
  },
  {
    title: "Zine-Making Afternoon",
    description: "Cut, paste, photocopy: everyone left with a stapled eight-page zine about their own street.",
    starts_at: "2026-10-17T14:00", capacity: 50, venue: "Biblusi Reading Room", category: "Workshop", organizer: 1,
  },
  {
    title: "Node.js Performance Night",
    description: "Profiling a slow Express API live on stage, plus a short talk on worker threads.",
    starts_at: "2026-10-28T19:00", capacity: 60, venue: "Impact Hub Tbilisi", category: "Tech talk", organizer: 2,
  },
  {
    title: "Polyphony Evening: Georgian Folk Choir",
    description: "A twelve-voice choir sang traditional songs from Guria and Svaneti, with a short introduction to each region's style.",
    starts_at: "2026-11-07T20:00", capacity: 250, venue: "Fabrika Courtyard", category: "Music", organizer: 1,
  },
];

// [event index, attendee emails]
const bookings = [
  [0, ["attendee@doorlist.test", "luka.tsiklauri@doorlist.test", "mariam.chikovani@doorlist.test", "saba.javakhishvili@doorlist.test"]],
  [1, ["luka.tsiklauri@doorlist.test", "elene.abashidze@doorlist.test", "saba.javakhishvili@doorlist.test"]],
  // the wine tasting fills up completely (see crowd below)
  [2, ["luka.tsiklauri@doorlist.test", "mariam.chikovani@doorlist.test", "saba.javakhishvili@doorlist.test", "elene.abashidze@doorlist.test"]],
  [3, ["attendee@doorlist.test", "elene.abashidze@doorlist.test"]],
  [4, ["mariam.chikovani@doorlist.test"]],
  [7, ["saba.javakhishvili@doorlist.test", "luka.tsiklauri@doorlist.test"]],
  // organizers can book other organizers' events too: Nino goes to Giorgi's clinic
  [5, ["organizer@doorlist.test"]],
  // past events
  [8, ["luka.tsiklauri@doorlist.test", "elene.abashidze@doorlist.test", "organizer@doorlist.test"]],
  [9, ["attendee@doorlist.test", "mariam.chikovani@doorlist.test", "saba.javakhishvili@doorlist.test", "luka.tsiklauri@doorlist.test"]],
  [10, ["attendee@doorlist.test", "elene.abashidze@doorlist.test"]],
  [11, ["attendee@doorlist.test", "luka.tsiklauri@doorlist.test", "mariam.chikovani@doorlist.test", "saba.javakhishvili@doorlist.test", "elene.abashidze@doorlist.test"]],
  [12, ["mariam.chikovani@doorlist.test", "organizer@doorlist.test", "elene.abashidze@doorlist.test"]],
  [13, ["attendee@doorlist.test", "saba.javakhishvili@doorlist.test"]],
  [14, ["luka.tsiklauri@doorlist.test", "organizer@doorlist.test", "saba.javakhishvili@doorlist.test", "attendee@doorlist.test"]],
  [15, ["attendee@doorlist.test", "luka.tsiklauri@doorlist.test", "mariam.chikovani@doorlist.test", "elene.abashidze@doorlist.test", "saba.javakhishvili@doorlist.test"]],
];

// More attendees, so the seat counts look like a real city: every event is
// filled up to this many bookings (named bookings above count too).
const FIRST = ["Nino", "Giorgi", "Mariam", "Luka", "Ana", "Davit", "Elene", "Saba", "Tamar", "Nika", "Salome", "Irakli",
  "Ketevan", "Levan", "Natia", "Sandro", "Tekla", "Zura", "Lizi", "Beka", "Anano", "Dachi", "Mariami", "Tornike",
  "Nutsa", "Gela", "Sopho", "Lasha", "Eka", "Otar"];
const LAST = ["Beridze", "Kapanadze", "Gelashvili", "Lomidze", "Tsiklauri", "Chikovani", "Javakhishvili", "Abashidze",
  "Maisuradze", "Mamaladze", "Kiknadze", "Gogua", "Charaia", "Jgharkava", "Nozadze", "Bakradze", "Kvaratskhelia",
  "Shengelia", "Gvasalia", "Dolidze", "Tsereteli", "Khurtsidze", "Mchedlishvili", "Vachnadze", "Kurtanidze"];
const CROWD_SIZE = 260;
const crowd = Array.from({ length: CROWD_SIZE }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  return { name: `${first} ${last}`, email: `${first}.${last}.${i + 1}@doorlist.test`.toLowerCase() };
});

// target number of booked seats per event (same order as `events`)
const BOOKED = [96, 52, 50, 34, 47, 31, 241, 54, 62, 171, 48, 55, 88, 41, 57, 212];

transaction(() => {
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM request_replies;
    DELETE FROM requests;
    DELETE FROM registrations;
    DELETE FROM events;
    DELETE FROM venues;
    DELETE FROM categories;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role, status, organization) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const userIds = {};
  for (const u of users) {
    const { lastInsertRowid } = insertUser.run(
      u.name, u.email, bcrypt.hashSync(u.password, 10), u.role, u.status ?? "active", u.organization ?? null
    );
    userIds[u.email] = Number(lastInsertRowid);
  }
  const organizerIds = { 1: userIds["organizer@doorlist.test"], 2: userIds["giorgi.lomidze@doorlist.test"] };

  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  const categoryIds = {};
  for (const name of categories) categoryIds[name] = Number(insertCategory.run(name).lastInsertRowid);

  const insertVenue = db.prepare("INSERT INTO venues (name, address, capacity) VALUES (?, ?, ?)");
  const venueIds = {};
  for (const v of venues) venueIds[v.name] = Number(insertVenue.run(v.name, v.address, v.capacity).lastInsertRowid);

  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, starts_at, capacity, venue_id, category_id, organizer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const eventIds = events.map((e) =>
    Number(
      insertEvent.run(
        e.title, e.description, e.starts_at, e.capacity,
        venueIds[e.venue], categoryIds[e.category], organizerIds[e.organizer]
      ).lastInsertRowid
    )
  );

  const insertBooking = db.prepare("INSERT INTO registrations (event_id, user_id) VALUES (?, ?)");
  for (const [index, emails] of bookings) {
    for (const email of emails) insertBooking.run(eventIds[index], userIds[email]);
  }

  // the crowd: one shared password hash keeps the seed fast
  const crowdHash = bcrypt.hashSync("Attendee123!", 10);
  const crowdIds = crowd.map(
    (c) => Number(insertUser.run(c.name, c.email, crowdHash, "attendee", "active", null).lastInsertRowid)
  );
  const bookedCount = db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ?");
  eventIds.forEach((eventId, index) => {
    let need = BOOKED[index] - bookedCount.get(eventId).n;
    // start at a different place in the crowd for each event, so lists differ
    for (let k = 0; need > 0 && k < crowdIds.length; k++) {
      insertBooking.run(eventId, crowdIds[(index * 37 + k) % crowdIds.length]);
      need--;
    }
  });
});

// Requests from organizers to the admins, with the admin's replies over time
const requests = [
  {
    from: "organizer@doorlist.test",
    subject: "Please add Mtatsminda Park Open-Air Stage",
    body: "Hi! I'd like to run a summer concert series at the open-air stage in Mtatsminda Park (about 400 seats). Could you add it as a venue?",
    status: "completed",
    created: "2026-11-02 10:15:00",
    replies: [
      ["I'm asking the park for the exact seat count first.", "in_progress", "2026-11-03 09:40:00"],
      ["Done. Mtatsminda Park Open-Air Stage will be listed as soon as the park confirms the seats.", "completed", "2026-11-06 14:20:00"],
    ],
  },
  {
    from: "organizer@doorlist.test",
    subject: "Wine Factory cellar seats",
    body: "The cellar now has a second room. Could the capacity of Wine Factory N1 Cellar be raised from 40 to 60?",
    status: "in_progress",
    created: "2026-11-18 16:40:00",
    replies: [["Checking with the venue manager, I'll update the capacity after their confirmation.", "in_progress", "2026-11-19 09:30:00"]],
  },
  {
    from: "giorgi.lomidze@doorlist.test",
    subject: "New category: Film screenings",
    body: "We want to start a monthly film club with screenings and short discussions. A 'Film' category would make it easier for people to find.",
    status: "new",
    created: "2026-11-23 09:05:00",
    replies: [],
  },
  {
    from: "giorgi.lomidze@doorlist.test",
    subject: "Move the Postgres clinic to Fabrika",
    body: "Could the Postgres Performance Clinic be moved to Fabrika Courtyard? We expect more people.",
    status: "cancelled",
    created: "2026-11-10 13:00:00",
    replies: [["Cancelled as you asked in your follow-up email: the clinic stays at Impact Hub.", "cancelled", "2026-11-11 10:05:00"]],
  },
];

transaction(() => {
  const userId = (email) => db.prepare("SELECT id FROM users WHERE email = ?").get(email).id;
  const adminId = userId("admin@doorlist.test");
  const insert = db.prepare(
    "INSERT INTO requests (organizer_id, subject, body, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertReply = db.prepare(
    "INSERT INTO request_replies (request_id, admin_id, body, status, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const r of requests) {
    const updated = r.replies.at(-1)?.[2] ?? r.created;
    const id = Number(insert.run(userId(r.from), r.subject, r.body, r.status, r.created, updated).lastInsertRowid);
    for (const [body, status, at] of r.replies) insertReply.run(id, adminId, body, status, at);
  }
});

// A few notifications so the bell isn't empty in the demo
transaction(() => {
  const userId = (email) => db.prepare("SELECT id FROM users WHERE email = ?").get(email).id;
  const eventId = (title) => db.prepare("SELECT id FROM events WHERE title = ?").get(title).id;
  const insert = db.prepare("INSERT INTO notifications (user_id, message, link, read_at, created_at) VALUES (?, ?, ?, ?, ?)");
  const wine = eventId("Natural Wine Tasting: Kakheti Qvevri");
  const jazz = eventId("Late Jazz at the Courtyard");
  insert.run(userId("attendee@doorlist.test"), "“Late Jazz at the Courtyard”, which you booked, was updated. Click to view new details.", `/events/${jazz}`, null, "2026-11-23 18:20:00");
  insert.run(userId("organizer@doorlist.test"), "“Natural Wine Tasting: Kakheti Qvevri” is fully booked: all 50 seats are taken.", `/events/${wine}`, null, "2026-11-22 12:05:00");
  insert.run(userId("organizer@doorlist.test"), "Your request “Wine Factory cellar seats”: the admin replied and status is now Work in progress.", "/my/requests", "2026-11-19 10:00:00", "2026-11-19 09:30:00");
  insert.run(userId("admin@doorlist.test"), "New request from Giorgi Lomidze: “New category: Film screenings”", "/admin/requests", null, "2026-11-23 09:05:00");
  insert.run(userId("admin@doorlist.test"), "New organizer sign-up: Keti Mamaladze (Sololaki Photo Walks) is waiting for approval.", "/admin/organizers", null, "2026-11-22 15:40:00");
  insert.run(userId("admin@doorlist.test"), "New organizer sign-up: Levan Kiknadze (Board Game Club Vake) is waiting for approval.", "/admin/organizers", null, "2026-11-21 11:10:00");
});

const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
console.log(`Seeded ${DB_FILE}`);
for (const t of ["users", "categories", "venues", "events", "registrations", "requests", "request_replies", "notifications"]) {
  console.log(`  ${t.padEnd(14)} ${count(t)}`);
}
