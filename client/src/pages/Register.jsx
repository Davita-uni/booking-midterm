import { useState } from "react";
import { useAuth, homeFor } from "../auth.jsx";
import { Link, navigate } from "../router.jsx";
import Field from "../components/Field.jsx";
import { AuthIntro } from "./Login.jsx";

// Sign-up.
// Most people book events, so the main path is one simple form that creates an
// attendee account. Organizers use a smaller link under it, which opens a
// three-step version: 1. Organization  2. Your details  3. Done (approval).
// The step headers are buttons, so people can go back without the Back button.

const ORGANIZER_STEPS = ["Organization", "Your details", "Done"];

function Steps({ current, onGo }) {
  return (
    <ol className="steps" aria-label="Sign-up progress">
      {ORGANIZER_STEPS.map((label, i) => {
        const state = i === current ? "is-current" : i < current ? "is-done" : undefined;
        // the last step ("Done") is reached by sending the form, not by clicking
        const clickable = i !== current && i < ORGANIZER_STEPS.length - 1;
        return (
          <li key={label} className={state} aria-current={i === current ? "step" : undefined}>
            {clickable ? (
              <button type="button" className="steps__btn" onClick={() => onGo(i)}>
                <span className="steps__no mono">{i + 1}</span>
                {label}
              </button>
            ) : (
              <span className="steps__btn">
                <span className="steps__no mono">{i + 1}</span>
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const initialRole = () =>
  new URLSearchParams(window.location.search).get("as") === "organizer" ? "organizer" : "attendee";

export default function Register() {
  const { register } = useAuth();
  const [role, setRole] = useState(initialRole);
  const [step, setStep] = useState(0); // organizer steps only
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", password: "", organization: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const isOrganizer = role === "organizer";

  const switchRole = (next) => {
    setRole(next);
    setStep(0);
    setErrors({});
    setMessage("");
    window.history.replaceState(null, "", next === "organizer" ? "/register?as=organizer" : "/register");
  };

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const body = {
        role,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      };
      if (isOrganizer) body.organization = form.organization;
      const user = await register(body);
      navigate(homeFor(user)); // organizers land on their account status page ("Done")
    } catch (err) {
      setErrors(err.errors);
      // the organization field lives on step 1
      if (isOrganizer && err.errors.organization) setStep(0);
      setMessage(Object.keys(err.errors).length ? "" : err.message);
    } finally {
      setBusy(false);
    }
  };

  const detailsFields = (
    <>
      <div className="form-row">
        <Field
          label="First name"
          name="first_name"
          autoComplete="given-name"
          placeholder="Nino"
          value={form.first_name}
          onChange={update}
          error={errors.first_name}
        />
        <Field
          label="Last name"
          name="last_name"
          autoComplete="family-name"
          placeholder="Beridze"
          value={form.last_name}
          onChange={update}
          error={errors.last_name}
        />
      </div>
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
        hint="At least 8 characters, with a letter and a number"
        value={form.password}
        onChange={update}
        error={errors.password}
      />
    </>
  );

  return (
    <div className="auth">
      <AuthIntro />
      <section className="panel">
        {!isOrganizer ? (
          <>
            <h2>Create an Account</h2>
            <form className="form" onSubmit={submit} noValidate>
              {message && (
                <p className="alert" role="alert">
                  {message}
                </p>
              )}
              {detailsFields}
              <button className="btn btn--primary" disabled={busy}>
                {busy ? "Creating account…" : "Create account"}
              </button>
            </form>
            <p className="panel__foot">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
            <p className="organizer-link">
              Run events?{" "}
              <button type="button" className="link-btn" onClick={() => switchRole("organizer")}>
                Apply for an organizer account
              </button>
            </p>
          </>
        ) : (
          <>
            <h2>Organizer Account</h2>
            <Steps current={step} onGo={setStep} />

            {step === 0 && (
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep(1);
                }}
                noValidate
              >
                <p className="step-note">
                  Organizers publish events and see who has tickets. An admin approves new organizer accounts; you
                  can get tickets for events while you wait.
                </p>
                <Field
                  label="Organization or project"
                  name="organization"
                  autoComplete="organization"
                  placeholder="Courtyard Sessions"
                  hint="Shown on your events and helps the admin recognise you"
                  value={form.organization}
                  onChange={update}
                  error={errors.organization}
                />
                <div className="form__actions">
                  <button className="btn btn--primary">Continue</button>
                  <button type="button" className="btn btn--ghost" onClick={() => switchRole("attendee")}>
                    Back to regular sign-up
                  </button>
                </div>
              </form>
            )}

            {step === 1 && (
              <form className="form" onSubmit={submit} noValidate>
                {message && (
                  <p className="alert" role="alert">
                    {message}
                  </p>
                )}
                {detailsFields}
                <div className="form__actions">
                  <button className="btn btn--primary" disabled={busy}>
                    {busy ? "Sending…" : "Send for approval"}
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
          </>
        )}
      </section>
    </div>
  );
}
