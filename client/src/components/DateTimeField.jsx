import { useId } from "react";

// 24-hour times in 15-minute steps: 00:00, 00:15 … 23:45
const TIMES = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  return `${h}:${m}`;
});

// Date picker + 24-hour time list. The browser's own date-and-time input shows
// AM/PM on English systems, so the time is a plain list instead.
// `value` and `onChange` use one string, "YYYY-MM-DDTHH:MM", like the API.
export default function DateTimeField({ label, name, value, onChange, error }) {
  const id = useId();
  const [date = "", time = ""] = (value || "").split("T");

  const emit = (nextDate, nextTime) => {
    const combined = nextDate && nextTime ? `${nextDate}T${nextTime}` : nextDate ? `${nextDate}T` : "";
    onChange({ target: { name, value: combined } });
  };

  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <label htmlFor={`${id}-date`}>{label}</label>
      <div className="datetime">
        <input
          id={`${id}-date`}
          type="date"
          aria-label={`${label}: date`}
          aria-invalid={error ? "true" : undefined}
          value={date}
          onChange={(e) => emit(e.target.value, time)}
        />
        <select
          aria-label={`${label}: time`}
          aria-invalid={error ? "true" : undefined}
          value={TIMES.includes(time) ? time : ""}
          onChange={(e) => emit(date, e.target.value)}
        >
          <option value="">Time</option>
          {TIMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="field__error">{error}</p> : <p className="field__hint">24-hour time, in 15-minute steps</p>}
    </div>
  );
}
