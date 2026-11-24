import express from "express";
import cors from "cors";
import "./config/env.mjs";
import "./db/index.mjs";
import authRoutes from "./routes/auth.mjs";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Copy server/.env.example to server/.env.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.use("/api/auth", authRoutes);

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
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
