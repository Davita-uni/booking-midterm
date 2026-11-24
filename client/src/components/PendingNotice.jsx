import { HELP_PHONE } from "../config.js";

// Shown after an organizer signs up, and when a pending organizer tries to log in.
export default function PendingNotice({ name, suspended = false }) {
  if (suspended) {
    return (
      <div className="notice notice--error" role="status">
        <p className="notice__title">Your account is suspended</p>
        <p>An admin has suspended this organizer account, so you can't log in right now.</p>
        <p>
          For help, call our help center: <strong className="mono">{HELP_PHONE}</strong>
        </p>
      </div>
    );
  }
  return (
    <div className="notice" role="status">
      <p className="notice__title">Waiting for admin approval</p>
      <p>
        {name ? `Thanks, ${name.split(" ")[0]}. ` : ""}Your organizer account has been created, but an admin needs to
        approve it before you can use the platform. Please wait — you'll be able to log in as soon as it's approved.
      </p>
      <p>
        If it takes too long, call our help center:{" "}
        <strong className="mono">{HELP_PHONE}</strong>
      </p>
    </div>
  );
}
