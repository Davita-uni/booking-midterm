import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useApi } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import Field from "../components/Field.jsx";
import { Loading, ErrorState } from "../components/States.jsx";
import { Link } from "../router.jsx";
import { CURRENCIES } from "../config.js";

// My profile > Edit profile: name (and organization for organizers), password.
export default function ProfileEdit() {
  const account = useApi("/account");

  if (account.loading && !account.data) return <Loading label="Loading your profile…" />;
  if (account.error) return <ErrorState error={account.error} onRetry={account.reload} />;

  return (
    <>
      <Link to="/account/profile" className="back">
        ← My profile
      </Link>
      <div className="page-head">
        <div>
          <p className="eyebrow">My profile</p>
          <h1>Edit profile</h1>
        </div>
      </div>
      <div className="profile">
        <DetailsForm account={account.data} onSaved={account.setData} />
        <PasswordForm />
      </div>
    </>
  );
}

function DetailsForm({ account, onSaved }) {
  const { updateUser } = useAuth();
  const isOrganizer = account.role === "organizer";
  const [form, setForm] = useState({ name: "", email: "", organization: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      name: account.name,
      email: account.email,
      organization: account.organization ?? "",
      currency: account.currency,
    });
  }, [account]);

  const changed =
    form.name !== account.name ||
    form.currency !== account.currency ||
    (isOrganizer && form.organization !== (account.organization ?? ""));

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
    setMessage(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const body = { name: form.name, currency: form.currency };
      if (isOrganizer) body.organization = form.organization;
      const saved = await api("/account/profile", { method: "PUT", body });
      onSaved(saved);
      updateUser(saved);
      setMessage({ type: "success", text: "Profile saved." });
    } catch (err) {
      setErrors(err.errors);
      if (!Object.keys(err.errors).length) setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <h2>Profile details</h2>
      <form className="form" onSubmit={submit} noValidate>
        {message && (
          <p className={`alert${message.type === "success" ? " alert--success" : ""}`} role="status">
            {message.text}
          </p>
        )}
        <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={update} error={errors.name} />
        {isOrganizer && (
          <Field
            label="Organization or project"
            name="organization"
            autoComplete="organization"
            value={form.organization}
            onChange={update}
            error={errors.organization}
          />
        )}
        <Field
          label="Email"
          name="email"
          type="email"
          readOnly
          aria-readonly="true"
          className="is-readonly"
          hint="You log in with this email, so it can't be changed"
          value={form.email}
          error={errors.email}
        />
        <Field
          as="select"
          label="Currency"
          name="currency"
          hint="Ticket prices are set in GEL. By changing this setting you will get converted value shown on events page. Payment will also be completed in selected currency"
          value={form.currency ?? "GEL"}
          onChange={update}
          error={errors.currency}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Field>
        <div className="form__actions">
          <button className="btn btn--primary" disabled={busy || !changed}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          {changed && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setForm({
                  name: account.name,
                  email: account.email,
                  organization: account.organization ?? "",
                  currency: account.currency,
                });
                setErrors({});
              }}
            >
              Undo
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

const EMPTY_PW = { current_password: "", new_password: "", confirm: "" };

function PasswordForm() {
  const { passwordChanged } = useAuth();
  const [form, setForm] = useState(EMPTY_PW);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    // checked here only for convenience; the server validates the rest
    if (form.new_password && form.confirm !== form.new_password) {
      setErrors({ confirm: "The passwords don't match" });
      return;
    }
    setBusy(true);
    try {
      await api("/account/password", {
        method: "PUT",
        body: { current_password: form.current_password, new_password: form.new_password },
      });
      passwordChanged();
    } catch (err) {
      setErrors(err.errors);
      if (!Object.keys(err.errors).length) setMessage(err.message);
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <h2>Change password</h2>
      <form className="form" onSubmit={submit} noValidate>
        {message && (
          <p className="alert" role="alert">
            {message}
          </p>
        )}
        <Field
          label="Current password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          value={form.current_password}
          onChange={update}
          error={errors.current_password}
        />
        <Field
          label="New password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number"
          value={form.new_password}
          onChange={update}
          error={errors.new_password}
        />
        <Field
          label="Repeat new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={update}
          error={errors.confirm}
        />
        <p className="field__hint">After changing it you'll be logged out and log in again with the new password</p>
        <div className="form__actions">
          <button className="btn btn--primary" disabled={busy}>
            {busy ? "Changing…" : "Change password"}
          </button>
        </div>
      </form>
    </section>
  );
}
