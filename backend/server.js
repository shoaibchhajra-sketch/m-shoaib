// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/services");
const bookingRoutes = require("./routes/bookings");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);

// Serve the built React website (frontend/npm run build outputs here).
// This lets one single service host both the API and the site.
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Any route that isn't /api/* and isn't a real file falls back to the
// React app, so client-side routing (e.g. /dashboard) works on refresh.
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Fallback error handler so unexpected errors return JSON, not an HTML crash page
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Booking API running on http://localhost:${PORT}`);
});
