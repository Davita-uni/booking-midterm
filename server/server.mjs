import express from "express";
import cors from "cors";
import "./config/env.mjs";
import "./db/index.mjs";
import authRoutes from "./routes/auth.mjs";
import venueRoutes from "./routes/venues.mjs";
import categoryRoutes from "./routes/categories.mjs";
import eventRoutes from "./routes/events.mjs";
import registrationRoutes from "./routes/registrations.mjs";
import organizerRoutes from "./routes/organizers.mjs";
import accountRoutes from "./routes/account.mjs";
import requestRoutes from "./routes/requests.mjs";
import notificationRoutes from "./routes/notifications.mjs";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Copy server/.env.example to server/.env.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", registrationRoutes);
app.use("/api/admin/organizers", organizerRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Every error ends up here and becomes a JSON response:
// { message, errors?: { field: "message" } }
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message, errors: err.errors, code: err.code });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
