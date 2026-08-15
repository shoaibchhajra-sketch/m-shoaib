// routes/bookings.js
const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Business hours used to generate bookable time slots for a given day.
const OPEN_HOUR = 9; // 9 AM
const CLOSE_HOUR = 17; // 5 PM
const SLOT_STEP_MINUTES = 30;

function generateDaySlots() {
  const slots = [];
  for (let mins = OPEN_HOUR * 60; mins < CLOSE_HOUR * 60; mins += SLOT_STEP_MINUTES) {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

// GET /api/bookings/availability?serviceId=1&date=2026-08-20
// Returns which time slots are still free for that service on that date.
router.get("/availability", (req, res) => {
  const { serviceId, date } = req.query;
  if (!serviceId || !date) {
    return res.status(400).json({ error: "serviceId and date are required." });
  }

  const taken = db
    .prepare(
      `SELECT booking_time FROM bookings
       WHERE service_id = ? AND booking_date = ? AND status != 'cancelled'`
    )
    .all(serviceId, date)
    .map((r) => r.booking_time);

  const allSlots = generateDaySlots();
  const available = allSlots.filter((slot) => !taken.includes(slot));

  res.json({ date, slots: available });
});

// POST /api/bookings - logged-in user books an appointment
router.post("/", requireAuth, (req, res) => {
  const { serviceId, date, time, notes } = req.body;
  if (!serviceId || !date || !time) {
    return res.status(400).json({ error: "Service, date and time are all required." });
  }

  const service = db.prepare("SELECT * FROM services WHERE id = ? AND is_active = 1").get(serviceId);
  if (!service) return res.status(404).json({ error: "That service is not available." });

  const conflict = db
    .prepare(
      `SELECT id FROM bookings
       WHERE service_id = ? AND booking_date = ? AND booking_time = ? AND status != 'cancelled'`
    )
    .get(serviceId, date, time);
  if (conflict) {
    return res.status(409).json({ error: "That time slot was just taken. Please pick another." });
  }

  const result = db
    .prepare(
      `INSERT INTO bookings (user_id, service_id, booking_date, booking_time, notes, status)
       VALUES (?, ?, ?, ?, ?, 'confirmed')`
    )
    .run(req.user.id, serviceId, date, time, notes || "");

  const booking = db
    .prepare(
      `SELECT bookings.*, services.name AS service_name, services.duration_minutes, services.price
       FROM bookings JOIN services ON services.id = bookings.service_id
       WHERE bookings.id = ?`
    )
    .get(result.lastInsertRowid);

  res.status(201).json({ booking });
});

// GET /api/bookings/mine - the logged-in user's own bookings
router.get("/mine", requireAuth, (req, res) => {
  const bookings = db
    .prepare(
      `SELECT bookings.*, services.name AS service_name, services.duration_minutes, services.price
       FROM bookings JOIN services ON services.id = bookings.service_id
       WHERE bookings.user_id = ?
       ORDER BY bookings.booking_date DESC, bookings.booking_time DESC`
    )
    .all(req.user.id);

  res.json({ bookings });
});

// PUT /api/bookings/:id/cancel - a user cancels their own booking
router.put("/:id/cancel", requireAuth, (req, res) => {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });

  const isOwner = booking.user_id === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "You can only cancel your own bookings." });
  }

  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// GET /api/bookings/all - admin sees every booking
router.get("/all", requireAuth, requireAdmin, (req, res) => {
  const bookings = db
    .prepare(
      `SELECT bookings.*, services.name AS service_name, users.name AS customer_name, users.email AS customer_email
       FROM bookings
       JOIN services ON services.id = bookings.service_id
       JOIN users ON users.id = bookings.user_id
       ORDER BY bookings.booking_date DESC, bookings.booking_time DESC`
    )
    .all();

  res.json({ bookings });
});

// PUT /api/bookings/:id/status - admin updates a booking's status
router.put("/:id/status", requireAuth, requireAdmin, (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "confirmed", "cancelled", "completed"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });

  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});

module.exports = router;
