import { useEffect, useState } from "react";
import api from "../api";

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/services").then((res) => setServices(res.data.services));
    loadMyBookings();
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    api
      .get("/bookings/availability", { params: { serviceId: selectedService.id, date } })
      .then((res) => setSlots(res.data.slots))
      .finally(() => setLoadingSlots(false));
  }, [selectedService, date]);

  function loadMyBookings() {
    api.get("/bookings/mine").then((res) => setBookings(res.data.bookings));
  }

  async function handleBook() {
    setError("");
    setSuccess("");
    if (!selectedService || !selectedSlot) return;
    setBusy(true);
    try {
      await api.post("/bookings", {
        serviceId: selectedService.id,
        date,
        time: selectedSlot,
        notes,
      });
      setSuccess(`Booked ${selectedService.name} on ${formatDate(date)} at ${selectedSlot}.`);
      setSelectedSlot(null);
      setNotes("");
      loadMyBookings();
      // refresh slots for the service/date
      const res = await api.get("/bookings/availability", {
        params: { serviceId: selectedService.id, date },
      });
      setSlots(res.data.slots);
    } catch (err) {
      setError(err.response?.data?.error || "Could not complete the booking.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(id) {
    await api.put(`/bookings/${id}/cancel`);
    loadMyBookings();
  }

  const upcoming = bookings.filter((b) => b.status !== "cancelled");

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Book an appointment</span>
          <h1>Find a time that works</h1>
        </div>
      </div>

      <div className="grid-2">
        {/* Booking flow */}
        <div className="card">
          <h3 className="section-title">1. Choose a service</h3>
          <div className="service-list">
            {services.map((s) => (
              <div
                key={s.id}
                className={`service-option ${selectedService?.id === s.id ? "selected" : ""}`}
                onClick={() => setSelectedService(s)}
              >
                <div>
                  <div className="name">{s.name}</div>
                  <div className="meta">{s.duration_minutes} min · {s.description}</div>
                </div>
                <div className="price">{s.price > 0 ? `$${s.price.toFixed(2)}` : "Free"}</div>
              </div>
            ))}
          </div>

          {selectedService && (
            <>
              <h3 className="section-title" style={{ marginTop: 26 }}>2. Pick a date</h3>
              <div className="field" style={{ maxWidth: 220 }}>
                <input
                  type="date"
                  value={date}
                  min={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <h3 className="section-title" style={{ marginTop: 10 }}>3. Pick a time</h3>
              {loadingSlots && <div className="loading-line">Loading available times…</div>}
              {!loadingSlots && slots.length === 0 && (
                <div className="slot-empty">No open times on this day — try another date.</div>
              )}
              {!loadingSlots && slots.length > 0 && (
                <div className="slot-grid">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-pill ${selectedSlot === slot ? "selected" : ""}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}

              {selectedSlot && (
                <>
                  <div className="field" style={{ marginTop: 20 }}>
                    <label htmlFor="notes">Notes (optional)</label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Anything the host should know before your appointment"
                    />
                  </div>

                  {error && <div className="error-banner">{error}</div>}
                  {success && <div className="success-banner">{success}</div>}

                  <button className="btn btn-brass" onClick={handleBook} disabled={busy}>
                    {busy ? "Booking…" : `Confirm ${selectedSlot} on ${formatDate(date)}`}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* My bookings */}
        <div className="card">
          <h3 className="section-title">Your appointments</h3>
          {upcoming.length === 0 && (
            <div className="empty-state">
              <h3>Nothing booked yet</h3>
              <p>Choose a service on the left to schedule your first appointment.</p>
            </div>
          )}
          {upcoming.map((b) => (
            <div className="booking-row" key={b.id}>
              <div>
                <div className="svc">{b.service_name}</div>
                <div className="when">{formatDate(b.booking_date)} · {b.booking_time}</div>
              </div>
              <span className={`status-badge status-${b.status}`}>{b.status}</span>
              <div />
              {b.status !== "cancelled" && b.status !== "completed" && (
                <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
