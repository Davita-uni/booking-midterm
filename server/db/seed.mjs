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
  { name: "Wine Factory N1 Cellar", address: "1 Vasil Petriashvili St", capacity: 40 },
  { name: "Biblusi Reading Room", address: "36 Shota Rustaveli Ave", capacity: 25 },
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
    starts_at: "2026-12-12T18:30", capacity: 4, venue: "Wine Factory N1 Cellar", category: "Food & drink", organizer: 1,
  },
  {
    title: "Writing Short Fiction — Saturday Workshop",
    description: "A three-hour workshop on openings and endings. Short exercises, feedback in small groups. Notebook required, laptops optional.",
    starts_at: "2026-12-19T12:00", capacity: 12, venue: "Biblusi Reading Room", category: "Workshop", organizer: 2,
  },
  {
    title: "The Cherry Orchard (in Georgian, English surtitles)",
    description: "A new chamber production of Chekhov's play by a young company. Running time is about two hours with one interval.",
    starts_at: "2026-12-22T19:00", capacity: 110, venue: "Rustaveli Theatre, Small Stage", category: "Theatre", organizer: 2,
  },
  {
    title: "Postgres Performance Clinic",
    description: "Bring a slow query and we will look at it together on the projector. Covers EXPLAIN, indexes and connection pooling.",
    starts_at: "2027-01-14T18:30", capacity: 40, venue: "Impact Hub Tbilisi", category: "Tech talk", organizer: 2,
  },
  {
    title: "Winter Electronic Night",
    description: "Three local DJs, a long night and a proper sound system. 18+ only, ID checked at the door.",
    starts_at: "2027-01-23T22:00", capacity: 280, venue: "Fabrika Courtyard", category: "Music", organizer: 1,
  },
  {
    title: "Khinkali Folding Class",
    description: "Learn to fold khinkali with a chef from Racha, then eat what you made. All ingredients and aprons provided.",
    starts_at: "2027-02-06T13:00", capacity: 16, venue: "Wine Factory N1 Cellar", category: "Food & drink", organizer: 1,
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
    starts_at: "2026-09-19T19:30", capacity: 36, venue: "Wine Factory N1 Cellar", category: "Food & drink", organizer: 1,
  },
  {
    title: "Hamlet (rehearsed reading)",
    description: "Six actors read the play in a new Georgian translation, followed by a talk with the translator.",
    starts_at: "2026-10-03T19:00", capacity: 110, venue: "Rustaveli Theatre, Small Stage", category: "Theatre", organizer: 2,
  },
  {
    title: "Zine-Making Afternoon",
    description: "Cut, paste, photocopy: everyone left with a stapled eight-page zine about their own street.",
    starts_at: "2026-10-17T14:00", capacity: 18, venue: "Biblusi Reading Room", category: "Workshop", organizer: 1,
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
  // the wine tasting is full: 4 of 4 seats
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

transaction(() => {
  db.exec(`
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
});

const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
console.log(`Seeded ${DB_FILE}`);
for (const t of ["users", "categories", "venues", "events", "registrations"]) {
  console.log(`  ${t.padEnd(14)} ${count(t)}`);
}
