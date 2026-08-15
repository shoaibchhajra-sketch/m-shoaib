// routes/services.js
const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/services - anyone can see the active list of services to book
router.get("/", (req, res) => {
  const services = db
    .prepare("SELECT * FROM services WHERE is_active = 1 ORDER BY id ASC")
    .all();
  res.json({ services });
});

// GET /api/services/all - admin sees every service, including inactive ones
router.get("/all", requireAuth, requireAdmin, (req, res) => {
  const services = db.prepare("SELECT * FROM services ORDER BY id ASC").all();
  res.json({ services });
});

// POST /api/services - admin creates a new service
router.post("/", requireAuth, requireAdmin, (req, res) => {
  const { name, description, duration_minutes, price } = req.body;
  if (!name || !duration_minutes) {
    return res.status(400).json({ error: "Name and duration are required." });
  }

  const result = db
    .prepare(
      "INSERT INTO services (name, description, duration_minutes, price) VALUES (?, ?, ?, ?)"
    )
    .run(name.trim(), description || "", Number(duration_minutes), Number(price) || 0);

  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ service });
});

// PUT /api/services/:id - admin edits a service
router.put("/:id", requireAuth, requireAdmin, (req, res) => {
  const { name, description, duration_minutes, price, is_active } = req.body;
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Service not found." });

  db.prepare(
    `UPDATE services SET name = ?, description = ?, duration_minutes = ?, price = ?, is_active = ?
     WHERE id = ?`
  ).run(
    name ?? existing.name,
    description ?? existing.description,
    duration_minutes ?? existing.duration_minutes,
    price ?? existing.price,
    is_active === undefined ? existing.is_active : (is_active ? 1 : 0),
    req.params.id
  );

  const service = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  res.json({ service });
});

// DELETE /api/services/:id - admin removes a service
router.delete("/:id", requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare("SELECT * FROM services WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Service not found." });

  db.prepare("DELETE FROM services WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
