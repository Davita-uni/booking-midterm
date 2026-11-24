import { useAuth } from "../auth.jsx";
import { RATES_FROM_GEL } from "../config.js";
import { priceIn } from "../format.js";

// Ticket price in the user's currency only: "35 ₾", or "13 USD" / "11 EUR"
// (converted from GEL and rounded up). Visitors see GEL.
export function usePriceText() {
  const { user } = useAuth();
  const currency = user?.currency ?? "GEL";
  return (value, quantity = 1) => priceIn(value, currency, RATES_FROM_GEL, quantity);
}

export default function Price({ value, className = "" }) {
  const priceText = usePriceText();
  return (
    <span className={`price ${className}`}>
      <span className="price__gel">{priceText(value)}</span>
    </span>
  );
}
