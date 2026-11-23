// Small validation helpers. Each check adds a message to `errors` under the
// field name, so the client can show it under the right input.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function text(errors, body, field, label, { min = 1, max = 200, required = true } = {}) {
  const raw = body[field];
  if (raw !== undefined && raw !== null && typeof raw !== "string") {
    errors[field] = `${label} must be text`;
    return undefined;
  }
  const value = (raw ?? "").trim();
  if (!value) {
    if (required) errors[field] = `${label} is required`;
    return value;
  }
  if (value.length < min) errors[field] = `${label} must be at least ${min} characters`;
  else if (value.length > max) errors[field] = `${label} must be at most ${max} characters`;
  return value;
}

export function email(errors, body, field = "email") {
  const value = text(errors, body, field, "Email", { max: 120 });
  if (value && !errors[field] && !EMAIL.test(value)) errors[field] = "Enter a valid email address";
  return value?.toLowerCase();
}

export function password(errors, body, field = "password") {
  const value = typeof body[field] === "string" ? body[field] : "";
  if (!value) errors[field] = "Password is required";
  else if (value.length < 8) errors[field] = "Password must be at least 8 characters";
  else if (value.length > 72) errors[field] = "Password must be at most 72 characters";
  else if (!/[A-Za-z]/.test(value) || !/\d/.test(value))
    errors[field] = "Password needs at least one letter and one number";
  return value;
}

export function integer(errors, body, field, label, { min = 1, max = 100000 } = {}) {
  const raw = body[field];
  if (raw === undefined || raw === null || raw === "") {
    errors[field] = `${label} is required`;
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) errors[field] = `${label} must be a whole number`;
  else if (value < min) errors[field] = `${label} must be at least ${min}`;
  else if (value > max) errors[field] = `${label} must be at most ${max}`;
  return value;
}

export function oneOf(errors, body, field, label, allowed) {
  const value = body[field];
  if (!allowed.includes(value)) errors[field] = `Choose a valid ${label.toLowerCase()}`;
  return value;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
