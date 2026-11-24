import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Link, navigate } from "../router.jsx";
import Field from "../components/Field.jsx";

// Organizer: an email-like form to the admins.
export default function NewRequest() {
  const { user } = useAuth();
  const [form, setForm] = useState({ subject: "", body: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api("/requests", { method: "POST", body: form });
      navigate("/my/requests?sent=1");
    } catch (err) {
      setErrors(err.errors);
      if (!Object.keys(err.errors).length) setMessage(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/my/requests" className="back">
        ← My requests
      </Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">My requests</p>
          <h1>New request</h1>
        </div>
      </div>

      <form className="mail panel" onSubmit={submit} noValidate>
        {message && (
          <p className="alert" role="alert">
            {message}
          </p>
        )}
        <div className="mail__line">
          <span className="mail__label">To</span>
          <span>Doorlist admins</span>
        </div>
        <div className="mail__line">
          <span className="mail__label">From</span>
          <span className="break">
            {user.name} <span className="muted">&lt;{user.email}&gt;</span>
          </span>
        </div>
        <Field
          label="Subject"
          name="subject"
          placeholder="Please add a new venue"
          value={form.subject}
          onChange={update}
          error={errors.subject}
        />
        <Field
          as="textarea"
          label="Request"
          name="body"
          rows={8}
          placeholder="Describe what you need: the venue's name and address, number of seats, a new category…"
          value={form.body}
          onChange={update}
          error={errors.body}
        />
        <div className="form__actions">
          <button className="btn btn--primary" disabled={busy}>
            {busy ? "Sending…" : "Send request"}
          </button>
          <Link to="/my/requests" className="btn btn--ghost">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
