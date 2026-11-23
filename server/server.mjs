import express from "express";
import cors from "cors";
import "./config/env.mjs";
import "./db/index.mjs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// API routes are added in the next versions.

app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Malformed JSON and unexpected errors end up here.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
