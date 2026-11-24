import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { Link, navigate } from "../router.jsx";
import Field from "../components/Field.jsx";
import PendingNotice from "../components/PendingNotice.jsx";

export function AuthIntro() {
  return (
    <div className="auth__intro">
      <p className="eyebrow">Doorlist</p>
      <h1>Your name on the door.</h1>
      <p>Book a seat at concerts, talks and workshops around Tbilisi, or run your own events and see who is coming.</p>
      <div className="ticket-stub" aria-hidden="true">
        <span>ADMIT ONE</span>
        <b>Late Jazz at the Courtyard</b>
        <span>FRI 04 DEC 2026 · 20:00</span>
        <span>Fabrika Courtyard</span>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState(null); // "pending" | "suspended"
  const expired = new URLSearchParams(window.location.search).has("expired");

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setAccount(null);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      if (err.code === "account_pending" || err.code === "account_suspended") {
        setAccount(err.code === "account_pending" ? "pending" : "suspended");
        return;
      }
      setErrors(err.errors);
      setMessage(Object.keys(err.errors).length ? "" : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthIntro />
      <section className="panel">
        <h2>Log in</h2>
        <form className="form" onSubmit={submit} noValidate>
          {expired && !message && <p className="alert alert--info">Your session ended. Please log in again.</p>}
          {message && (
            <p className="alert" role="alert">
              {message}
            </p>
          )}
          {account && <PendingNotice suspended={account === "suspended"} />}
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update}
            error={errors.email}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={form.password}
            onChange={update}
            error={errors.password}
          />
          <button className="btn btn--primary" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="panel__foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </div>
  );
}
