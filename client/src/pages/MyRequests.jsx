import { useApi } from "../hooks.js";
import { Link } from "../router.jsx";
import { bookedOn } from "../format.js";
import RequestStatus from "../components/RequestStatus.jsx";
import { Loading, ErrorState, Empty } from "../components/States.jsx";

// Organizer: requests sent to the admins, with their replies and status.
export default function MyRequests() {
  const requests = useApi("/requests");
  const sent = new URLSearchParams(window.location.search).has("sent");

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">My account</p>
          <h1>My requests</h1>
        </div>
        <Link to="/my/requests/new" className="btn btn--primary">
          Add new request
        </Link>
      </div>

      {sent && <p className="alert alert--success spaced">Your request was sent to the admins.</p>}

      {requests.loading && !requests.data ? (
        <Loading label="Loading your requests…" />
      ) : requests.error ? (
        <ErrorState error={requests.error} onRetry={requests.reload} />
      ) : requests.data.length === 0 ? (
        <Empty
          title="No requests yet"
          action={
            <Link to="/my/requests/new" className="btn btn--primary">
              Add new request
            </Link>
          }
        >
          Need a new venue or category, or a change to one? Send a request to the admins.
        </Empty>
      ) : (
        <ul className="requests">
          {requests.data.map((r) => (
            <li key={r.id} className="request panel">
              <div className="request__head">
                <h2 className="request__subject">{r.subject}</h2>
                <RequestStatus status={r.status} />
              </div>
              <p className="request__meta mono">Sent {bookedOn(r.created_at)}</p>
              <p className="request__body">{r.body}</p>
              {r.admin_reply ? (
                <div className="request__reply">
                  <p className="request__reply-head">
                    Admin reply <span className="mono muted">· {bookedOn(r.replied_at)}</span>
                  </p>
                  <p className="request__body">{r.admin_reply}</p>
                </div>
              ) : (
                <p className="request__waiting muted">No reply yet.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
