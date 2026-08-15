// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, requireAuth } = require("../middleware/auth");

const router = express.Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  // The very first person to register with the address in ADMIN_EMAIL becomes an admin.
  const role = normalizedEmail === ADMIN_EMAIL ? "admin" : "customer";

  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)")
    .run(name.trim(), normalizedEmail, passwordHash, role);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  const token = signToken(user);

  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// GET /api/auth/me - returns the logged-in user based on the token
router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

module.exports = router;
