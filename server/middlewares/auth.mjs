import jwt from "jsonwebtoken";
import { db } from "../db/index.mjs";
import { unauthorized, forbidden } from "../utils/http.mjs";

const SECRET = () => process.env.JWT_SECRET;

const findUser = db.prepare("SELECT id, name, email, role, status, organization, token_version FROM users WHERE id = ?");

export function signToken(user) {
  return jwt.sign({ sub: user.id, ver: user.token_version }, SECRET(), { expiresIn: "7d" });
}

// Reads "Authorization: Bearer <token>", checks it and loads the user
// from the database, so a deleted user or a changed role is seen at once.
export function requireAuth(req, res, next) {
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
  // a suspended (or not yet approved) account can't do anything
  if (user.status !== "active") throw unauthorized("Your account is not active");

  req.user = {
    id: user.id, name: user.name, email: user.email, role: user.role,
    status: user.status, organization: user.organization,
  };
  next();
}

// Like requireAuth, but lets visitors without a token through (req.user stays undefined).
// Used on public pages that show extra details to logged-in users.
export function optionalAuth(req, res, next) {
  if (!req.get("authorization")) return next();
  try {
    requireAuth(req, res, () => {});
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
