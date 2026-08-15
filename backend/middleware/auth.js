// middleware/auth.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// Verifies the Authorization: Bearer <token> header and attaches
// the decoded user (id, email, role) to req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "You must be logged in to do that." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
}

// Use after requireAuth to restrict a route to admins only
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "You don't have permission to do that." });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, JWT_SECRET };
