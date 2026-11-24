// Event times come from the API as local time "YYYY-MM-DDTHH:MM".
// They are split by hand so the browser's time zone never shifts them.

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function parts(value) {
  const [date, time = "00:00"] = value.split("T");
  const [y, m, d] = date.split("-").map(Number);
  return {
    year: y,
    month: MONTHS[m - 1],
    day: String(d).padStart(2, "0"),
    weekday: DAYS[new Date(y, m - 1, d).getDay()],
    time: time.slice(0, 5),
  };
}

// "FRI 04 DEC 2026 · 20:00"
export function longDate(value) {
  const p = parts(value);
  return `${p.weekday} ${p.day} ${p.month} ${p.year} · ${p.time}`;
}

export function seatsLabel(event) {
  if (event.seats_left === 0) return "Sold out";
  return `${event.seats_left} left`;
}

// Colour of the seats label:
//   out  = sold out (solid red badge)
//   low  = fewer than 10 left (red text)
//   warn = amber: fewer than 50 left for big events (200+ seats), fewer than 20 otherwise
//   ok   = green
export function seatsTone(event) {
  const left = event.seats_left;
  if (left === 0) return "out";
  if (left < 10) return "low";
  if (left < (event.capacity >= 200 ? 50 : 20)) return "warn";
  return "ok";
}

// created_at values are stored by SQLite in UTC: "YYYY-MM-DD HH:MM:SS"
export function bookedOn(value) {
  const d = new Date(value.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Request statuses as the users see them
export const REQUEST_STATUS = {
  new: "New",
  in_progress: "Work in progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// "24 Nov 2026, 09:05" in the viewer's time zone (stored in UTC)
export function dateTime(value) {
  const d = new Date(value.replace(" ", "T") + "Z");
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date}, ${time}`;
}
