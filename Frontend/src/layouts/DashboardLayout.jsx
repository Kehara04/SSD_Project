import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import dashboardBackground from "../assets/hos-bg.png";
import mediChannelLogo from "../assets/mediChannel.png";

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel =
    user?.role === "patient" ? "Patient"
      : user?.role === "doctor" ? "Doctor"
        : user?.role === "admin" ? "Admin"
          : "User";

  const navItems =
    user?.role === "admin"
      ? [
        { label: "Dashboard", path: "/admin" },
        { label: "Appointment Monitoring", path: "/admin/appointments" },
        { label: "Payment Monitoring", path: "/admin/payments" },
        { label: "All Users Overview", path: "/admin/users" },
        { label: "Create Administrator", path: "/register/admin" },
      ]
      : user?.role === "doctor"
        ? [{ label: "Dashboard", path: "/doctor" }]
        : [
          { label: "Dashboard", path: "/patient" },
          { label: "Check Symptoms AI", path: "/patient/symptom-checker" },
          { label: "Find Doctors", path: "/doctors" }
        ];

  const isActive = (path) => location.pathname === path;
  const showRoleBackground = user?.role === "patient" || user?.role === "doctor" || user?.role === "admin";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface-page)",
        backgroundImage: showRoleBackground
          ? `linear-gradient(rgba(243, 253, 246, 0.44), rgba(243, 253, 246, 0.44)), url(${dashboardBackground})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Navbar
        onMobileMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        mobileMenuOpen={isSidebarOpen}
      />

      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 998,
            }}
            className="show-on-mobile"
          />
        )}

        {/* Sidebar */}
        <aside
          style={{
            width: "240px",
            flexShrink: 0,
            background: "linear-gradient(180deg, var(--brand-800) 0%, var(--brand-900) 100%)",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: "64px",
            height: "calc(100vh - 64px)",
            zIndex: 999,
            transition: "transform 0.3s ease",
          }}
          className={`sidebar-container ${!isSidebarOpen ? "hide-on-mobile" : "sidebar-open"}`}
        >
          {/* Logo (Desktop only) */}
          <div
            className="hide-on-mobile"
            style={{
              padding: "1.5rem 1.25rem",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Link
              to="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              <img
                src={mediChannelLogo}
                alt="MediChannel logo"
                style={{
                  height: "38px",
                  width: "auto",
                  maxWidth: "180px",
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35)) brightness(1.08)",
                }}
              />
            </Link>
          </div>

          {/* User badge */}
          <div style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
              }}
            >
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {roleLabel} Portal
              </p>
              <p style={{ fontSize: "0.875rem", color: "#ffffff", fontWeight: 500, marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || user?.email || "—"}
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "0.5rem 0.75rem", flex: 1 }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: isActive(item.path) ? 600 : 400,
                  color: isActive(item.path) ? "#5eead4" : "rgba(255,255,255,0.65)",
                  background: isActive(item.path) ? "rgba(94,234,212,0.12)" : "transparent",
                  marginBottom: "2px",
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#fca5a5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
            >
              ← Log out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            minWidth: 0,
          }}
          className="main-content-responsive"
        >
          <div style={{ padding: "2rem 2.5rem" }} className="main-content-padding">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


