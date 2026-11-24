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
  if (event.seats_left <= Math.max(3, Math.ceil(event.capacity * 0.1))) return `${event.seats_left} left`;
  return `${event.seats_left} of ${event.capacity} free`;
}

// created_at values are stored by SQLite in UTC: "YYYY-MM-DD HH:MM:SS"
export function bookedOn(value) {
  const d = new Date(value.replace(" ", "T") + "Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Request statuses as the users see them
export const REQUEST_STATUS = { new: "New", in_progress: "Work in progress", completed: "Completed" };
