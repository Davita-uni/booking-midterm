import jwt from "jsonwebtoken";
import { db } from "../db/index.mjs";
import { unauthorized, forbidden } from "../utils/http.mjs";
import { PENDING_MESSAGE } from "../config/app.mjs";

const SECRET = () => process.env.JWT_SECRET;

const findUser = db.prepare("SELECT id, name, email, role, status, organization, token_version FROM users WHERE id = ?");

export function signToken(user) {
  return jwt.sign({ sub: user.id, ver: user.token_version }, SECRET(), { expiresIn: "7d" });
}

// Reads "Authorization: Bearer <token>", checks it and loads the user
// from the database, so a deleted user or a changed role is seen at once.
// Checks the token and loads the user. Pending organizers get a session too,
// but only routes that use requireSession accept them (status page, logout).
function loadSession(req) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, SECRET());
  } catch {
    throw unauthorized("Your session has expired, please log in again");
  }

  const user = findUser.get(payload.sub);
  // token_version goes up on logout, which makes older tokens invalid
  if (!user || user.token_version !== payload.ver) {
    throw unauthorized("Your session has expired, please log in again");
  }
  // suspended accounts can't do anything (their token was also revoked)
  if (user.status === "suspended") throw unauthorized("Your account is suspended");

  req.user = {
    id: user.id, name: user.name, email: user.email, role: user.role,
    status: user.status, organization: user.organization,
  };
}

// Any logged-in account, including organizers still waiting for approval.
export function requireSession(req, res, next) {
  loadSession(req);
  next();
}

// Active accounts only. A pending organizer gets 403 "account_pending".
export function requireAuth(req, res, next) {
  loadSession(req);
  if (req.user.status !== "active") throw forbidden(PENDING_MESSAGE, "account_pending");
  next();
}

// Like requireSession, but lets visitors without a token through (req.user stays
// undefined). Used on public pages that show extra details to logged-in users,
// such as "you booked this event".
export function optionalAuth(req, res, next) {
  if (!req.get("authorization")) return next();
  try {
    loadSession(req);
  } catch {
    // an old or broken token just means "not logged in" here
  }
  next();
}

// Use after requireAuth: requireRole("admin") or requireRole("organizer", "admin")
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw forbidden(`Only ${roles.join(" or ")} accounts can do this`);
    }
    next();
  };
}
