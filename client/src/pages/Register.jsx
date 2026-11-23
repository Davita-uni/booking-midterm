import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { Link, navigate } from "../router.jsx";
import Field from "../components/Field.jsx";
import { AuthIntro } from "./Login.jsx";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "attendee" });
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
      await register(form);
      navigate("/");
    } catch (err) {
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
        <h2>Create an account</h2>
        <form className="form" onSubmit={submit} noValidate>
          {message && (
            <p className="alert" role="alert">
              {message}
            </p>
          )}
          <Field
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Nino Beridze"
            value={form.name}
            onChange={update}
            error={errors.name}
          />
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="At least 8 characters, with a letter and a number."
            value={form.password}
            onChange={update}
            error={errors.password}
          />
          <fieldset className="choice">
            <legend>I want to</legend>
            <label>
              <input type="radio" name="role" value="attendee" checked={form.role === "attendee"} onChange={update} />
              <strong>Book events</strong>
              <span>Attendee account</span>
            </label>
            <label>
              <input type="radio" name="role" value="organizer" checked={form.role === "organizer"} onChange={update} />
              <strong>Run events</strong>
              <span>Organizer account</span>
            </label>
          </fieldset>
          {errors.role && <p className="field__error">{errors.role}</p>}
          <button className="btn btn--primary" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="panel__foot">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </div>
  );
}
