import { useAuth } from "../auth.jsx";
import { RATES_FROM_GEL } from "../config.js";
import { gel, converted } from "../format.js";

// Ticket price in GEL, plus the user's own currency if they chose USD or EUR.
export default function Price({ value, className = "" }) {
  const { user } = useAuth();
  const currency = user?.currency ?? "GEL";
  return (
    <span className={`price ${className}`}>
      <span className="price__gel">{gel(value)}</span>
      {value > 0 && currency !== "GEL" && (
        <span className="price__other mono" title="Approximate, at a fixed exchange rate">
          ≈ {converted(value, currency, RATES_FROM_GEL)}
        </span>
      )}
    </span>
  );
}
