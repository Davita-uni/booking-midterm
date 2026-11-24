import { REQUEST_STATUS } from "../format.js";

export default function RequestStatus({ status }) {
  return <span className={`req-status req-status--${status}`}>{REQUEST_STATUS[status]}</span>;
}
