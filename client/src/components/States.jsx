import { Link } from "../router.jsx";

export function Loading({ label = "Loading…" }) {
  return (
    <p className="loader" role="status">
      {label}
    </p>
  );
}

export function ErrorState({ error, onRetry }) {
  const title =
    error?.status === 403
      ? "You don't have access to this"
      : error?.status === 404
        ? "Not found"
        : "Something went wrong";
  return (
    <div className="state state--error" role="alert">
      <h3>{title}</h3>
      <p>{error?.message}</p>
      {onRetry && error?.status !== 403 && error?.status !== 404 ? (
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
      ) : (
        <Link to="/" className="btn">
          Back to events
        </Link>
      )}
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="state">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
