// Event times are stored as local wall-clock time ("YYYY-MM-DDTHH:MM"),
// the same format as <input type="datetime-local">.

const pad = (n) => String(n).padStart(2, "0");

export function nowLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isValidLocal(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const [date, time] = value.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const check = new Date(y, m - 1, d, h, min);
  return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d && h < 24 && min < 60;
}
