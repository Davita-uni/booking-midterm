import { useState } from "react";
import { useAuth, homeFor } from "../auth.jsx";
import { Link, navigate } from "../router.jsx";
import Field from "../components/Field.jsx";
import { AuthIntro } from "./Login.jsx";

// Sign-up in three steps:
//   1. account type (attendee or organizer)
//   2. details (organizers also give an organization name)
//   3. done — attendees go to the events, organizers to their account status
//      page, where they wait for an admin to approve them
const STEPS = ["Account type", "Your details", "Done"];

function Steps({ current }) {
  return (
    <ol className="steps" aria-label="Sign-up progress">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className={i === current ? "is-current" : i < current ? "is-done" : undefined}
          aria-current={i === current ? "step" : undefined}
        >
          <span className="steps__no mono">{i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

export default function Register() {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ role: "attendee", name: "", email: "", password: "", organization: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isOrganizer = form.role === "organizer";

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const body = { ...form };
      if (!isOrganizer) delete body.organization;
      const user = await register(body);
      navigate(homeFor(user));
    } catch (err) {
      setErrors(err.errors);
      // a wrong role is a step-1 problem
      if (err.errors.role) setStep(0);
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
        <Steps current={step} />

        {step === 0 && (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(1);
            }}
          >
            <fieldset className="choice choice--stacked">
              <legend>What do you want to do on Doorlist?</legend>
              <label>
                <input type="radio" name="role" value="attendee" checked={form.role === "attendee"} onChange={update} />
                <strong>Book events</strong>
                <span>Attendee account — browse events and book seats. Ready to use right away.</span>
              </label>
              <label>
                <input type="radio" name="role" value="organizer" checked={isOrganizer} onChange={update} />
                <strong>Run events</strong>
                <span>Organizer account — publish events and see who booked. An admin approves it first.</span>
              </label>
            </fieldset>
            {errors.role && <p className="field__error">{errors.role}</p>}
            <button className="btn btn--primary">Continue</button>
          </form>
        )}

        {step === 1 && (
          <form className="form" onSubmit={submit} noValidate>
            {message && (
              <p className="alert" role="alert">
                {message}
              </p>
            )}
            <p className="step-note">
              Signing up as <strong>{isOrganizer ? "an organizer" : "an attendee"}</strong>.{" "}
              <button type="button" className="link-btn" onClick={() => setStep(0)}>
                Change
              </button>
            </p>
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              placeholder="Nino Beridze"
              value={form.name}
              onChange={update}
              error={errors.name}
            />
            {isOrganizer && (
              <Field
                label="Organization or project"
                name="organization"
                autoComplete="organization"
                placeholder="Courtyard Sessions"
                hint="Helps the admin recognise you when approving the account."
                value={form.organization}
                onChange={update}
                error={errors.organization}
              />
            )}
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
            <div className="form__actions">
              <button className="btn btn--primary" disabled={busy}>
                {busy ? "Creating account…" : isOrganizer ? "Send for approval" : "Create account"}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setStep(0)}>
                Back
              </button>
            </div>
          </form>
        )}

        <p className="panel__foot">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </div>
  );
}
