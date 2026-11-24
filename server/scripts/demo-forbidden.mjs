// Shows that the server itself blocks actions a role is not allowed to do,
// even when someone skips the React app and calls the API directly.
// Start the API first (npm run dev), then: npm run demo:forbidden
import "../config/env.mjs";

const API = `http://localhost:${process.env.PORT || 3000}/api`;

async function call(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json();
  return { status: res.status, data };
}

async function login(email, password) {
  const { status, data } = await call("POST", "/auth/login", null, { email, password });
  if (status !== 200) throw new Error(`Login failed for ${email}. Did you run npm run seed?`);
  return data.token;
}

function show(title, { status, data }) {
  const mark = status === 401 || status === 403 ? "BLOCKED" : "allowed";
  console.log(`\n${title}\n  -> ${status} ${mark}: ${data?.message ?? ""}`);
}

try {
  const giorgi = await login("giorgi.lomidze@doorlist.test", "Organizer123!");
  const ana = await login("attendee@doorlist.test", "Attendee123!");

  const events = (await call("GET", "/events")).data;
  const ninosEvent = events.find((e) => e.organizer_name === "Nino Beridze");

  console.log(`Target: "${ninosEvent.title}" (id ${ninosEvent.id}), organized by Nino Beridze`);

  show(
    "1. Organizer Giorgi tries to edit Nino's event",
    await call("PUT", `/events/${ninosEvent.id}`, giorgi, { ...ninosEvent, title: "Changed by Giorgi" })
  );
  show("2. Organizer Giorgi tries to delete Nino's event", await call("DELETE", `/events/${ninosEvent.id}`, giorgi));
  show("3. Organizer Giorgi tries to read Nino's attendee list", await call("GET", `/events/${ninosEvent.id}/registrations`, giorgi));
  show("4. Attendee Ana tries to create an event", await call("POST", "/events", ana, { title: "Free party" }));
  show("5. Attendee Ana tries to add a venue (admin only)", await call("POST", "/venues", ana, { name: "My flat" }));
  show("6. Someone without a token tries to book a seat", await call("POST", `/events/${ninosEvent.id}/registrations`));

  // Ilia Uni internal meetings: only @iliauni.edu.ge accounts may see, book or create them
  const nana = await login("organizer@iliauni.edu.ge", "Organizer123!");
  const meeting = (await call("GET", "/events?audience=iliauni", nana)).data[0];
  console.log(`\nTarget: "${meeting.title}" (id ${meeting.id}), an internal Ilia Uni meeting`);
  show("7. Attendee Ana (not @iliauni.edu.ge) tries to list the Ilia Uni meetings", await call("GET", "/events?audience=iliauni", ana));
  show("8. Attendee Ana tries to open the meeting by its id", await call("GET", `/events/${meeting.id}`, ana));
  show("9. Attendee Ana tries to book a ticket for it", await call("POST", `/events/${meeting.id}/registrations`, ana, { quantity: 1 }));
  show(
    "10. Organizer Giorgi (not @iliauni.edu.ge) tries to create an Ilia Uni only event",
    await call("POST", "/events", giorgi, { ...ninosEvent, title: "Fake university meeting", audience: "iliauni" })
  );
  console.log();
} catch (err) {
  console.error(err.cause?.code === "ECONNREFUSED" ? `Can't reach ${API}. Start the server first (npm run dev).` : err.message);
  process.exitCode = 1;
}
