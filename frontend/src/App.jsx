import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";

function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="topbar">
      <Link to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} className="brand">
        <span className="mark" />
        Ostara
      </Link>
      {user && (
        <nav>
          {user.role === "admin" ? (
            <Link to="/admin">Admin</Link>
          ) : (
            <Link to="/dashboard">My appointments</Link>
          )}
          <span className="pill-role">{user.role}</span>
          <button className="linklike" onClick={handleLogout}>Log out</button>
        </nav>
      )}
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="main-area"><span className="loading-line">Loading…</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-wrap"><span className="loading-line">Loading…</span></div>;
  }

  return (
    <div className="app-shell">
      {user && <TopBar />}
      <div className={user ? "main-area" : ""}>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} /> : <Register />}
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} />} />
        </Routes>
      </div>
    </div>
  );
}
