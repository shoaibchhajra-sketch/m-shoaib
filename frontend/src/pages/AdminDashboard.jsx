import { useEffect, useState } from "react";
import api from "../api";

function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", duration_minutes: 30, price: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    loadBookings();
    loadServices();
  }, []);

  function loadBookings() {
    api.get("/bookings/all").then((res) => setBookings(res.data.bookings));
  }

  function loadServices() {
    api.get("/services/all").then((res) => setServices(res.data.services));
  }

  async function handleStatusChange(id, status) {
    await api.put(`/bookings/${id}/status`, { status });
    loadBookings();
  }

  async function handleCreateService(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/services", form);
      setForm({ name: "", description: "", duration_minutes: 30, price: 0 });
      loadServices();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create service.");
    }
  }

  async function toggleServiceActive(service) {
    await api.put(`/services/${service.id}`, { is_active: service.is_active ? 0 : 1 });
    loadServices();
  }

  async function deleteService(id) {
    if (!confirm("Delete this service? Existing bookings for it will remain on record.")) return;
    await api.delete(`/services/${id}`);
    loadServices();
  }

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Manage bookings & services</h1>
        </div>
      </div>

      <div className="admin-grid">
        <div className="stat-card"><div className="num">{stats.total}</div><div className="label">Total bookings</div></div>
        <div className="stat-card"><div className="num">{stats.confirmed}</div><div className="label">Confirmed</div></div>
        <div className="stat-card"><div className="num">{stats.pending}</div><div className="label">Pending</div></div>
        <div className="stat-card"><div className="num">{stats.cancelled}</div><div className="label">Cancelled</div></div>
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${tab === "bookings" ? "active" : ""}`} onClick={() => setTab("bookings")}>
          Bookings
        </button>
        <button className={`tab-btn ${tab === "services" ? "active" : ""}`} onClick={() => setTab("services")}>
          Services
        </button>
      </div>

      {tab === "bookings" && (
        <div className="card">
          {bookings.length === 0 && (
            <div className="empty-state">
              <h3>No bookings yet</h3>
              <p>Appointments will show up here once customers start booking.</p>
            </div>
          )}
          {bookings.map((b) => (
            <div className="booking-row" key={b.id}>
              <div>
                <div className="svc">{b.service_name}</div>
                <div className="when">{b.customer_name} · {b.customer_email}</div>
              </div>
              <div className="when">{formatDate(b.booking_date)} · {b.booking_time}</div>
              <span className={`status-badge status-${b.status}`}>{b.status}</span>
              <select value={b.status} onChange={(e) => handleStatusChange(b.id, e.target.value)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "services" && (
        <div className="grid-2">
          <div className="card">
            <h3 className="section-title">Add a service</h3>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={handleCreateService}>
              <div className="field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Price (USD)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <button className="btn btn-primary" type="submit">Add service</button>
            </form>
          </div>

          <div className="card">
            <h3 className="section-title">Existing services</h3>
            <div className="service-list">
              {services.map((s) => (
                <div className="service-option" key={s.id} style={{ cursor: "default" }}>
                  <div>
                    <div className="name">{s.name} {!s.is_active && <span style={{ color: "var(--danger)" }}>(hidden)</span>}</div>
                    <div className="meta">{s.duration_minutes} min · ${Number(s.price).toFixed(2)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleServiceActive(s)}>
                      {s.is_active ? "Hide" : "Show"}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteService(s.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
