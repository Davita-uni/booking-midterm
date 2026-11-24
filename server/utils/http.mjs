// An error with an HTTP status. Thrown from route handlers and turned
// into a JSON response by the error handler in server.mjs.
export class HttpError extends Error {
  constructor(status, message, errors, code) {
    super(message);
    this.status = status;
    this.errors = errors; // optional { field: "message" }
    this.code = code; // optional machine-readable reason, e.g. "account_pending"
  }
}

export const badRequest = (errors, message = "Please fix the highlighted fields") =>
  new HttpError(400, message, errors);
export const unauthorized = (message = "Please log in first") => new HttpError(401, message);
export const forbidden = (message = "You are not allowed to do this", code) =>
  new HttpError(403, message, undefined, code);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const conflict = (message, errors) => new HttpError(409, message, errors);

// Parses an id from the URL; anything that is not a positive whole number is a 404.
export function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw notFound();
  return id;
}
