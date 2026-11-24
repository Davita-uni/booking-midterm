import { dateTime, REQUEST_STATUS } from "../format.js";

// The admin's replies to a request, oldest first, each with its time and the
// status the request moved to.
export default function ReplyThread({ replies }) {
  if (!replies.length) return <p className="request__waiting muted">No reply yet.</p>;
  return (
    <ol className="replies">
      {replies.map((reply) => (
        <li key={reply.id} className="reply">
          <p className="reply__head">
            {reply.admin_name ? `${reply.admin_name} (admin)` : "Admin"}
            <span className="mono muted">
              {" "}
              · {dateTime(reply.created_at)} · {REQUEST_STATUS[reply.status]}
            </span>
          </p>
          <p className="request__body">{reply.body}</p>
        </li>
      ))}
    </ol>
  );
}
