import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import loginPageBackground from "../assets/hos-bg.png";
import mediChannelLogo from "../assets/mediChannel.png";
import "./Login.css";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const routeByRole = (role) => {
    if (role === "patient") return "/patient";
    if (role === "doctor") return "/doctor";
    if (role === "admin") return "/admin";
    return "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(form.email, form.password);
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate(routeByRole(result.user.role));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-page)" }}>
      <Navbar />
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          position: "relative",
          backgroundImage: `linear-gradient(110deg, rgba(7, 60, 53, 0.46), rgba(7, 60, 53, 0.36)), url(${loginPageBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "3rem clamp(1.25rem, 4vw, 4rem)",
        }}
      >
        <div className="login-animated-text">
          <h2 className="login-animated-title">Welcome to MediChannel</h2>
          <p className="login-animated-subtitle">
            Your trusted digital channel for modern healthcare.
          </p>
        </div>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#ffffff",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--brand-100)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)",
                padding: "2rem 2rem 1.75rem",
              }}
            >
              <img
                src={mediChannelLogo}
                alt="MediChannel logo"
                style={{
                  height: "48px",
                  width: "auto",
                  maxWidth: "160px",
                  objectFit: "contain",
                  display: "block",
                  marginBottom: "1rem",
                }}
              />
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                Welcome Back
              </h1>
              <p
                style={{
                  marginTop: "0.35rem",
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                Sign in as patient, doctor, or admin.
              </p>
            </div>

            <div style={{ padding: "2rem" }}>
              {error && (
                <div className="alert-error" style={{ marginBottom: "1.25rem" }}>
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="input"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="********"
                    required
                  />
                </div>

                <button
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "0.5rem", padding: "0.7rem" }}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div
                style={{
                  marginTop: "1.5rem",
                  paddingTop: "1.25rem",
                  borderTop: "1px solid var(--brand-100)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                  New patient?{" "}
                  <Link
                    to="/register/patient"
                    style={{ color: "var(--brand-600)", fontWeight: 500, textDecoration: "none" }}
                  >
                    Register here
                  </Link>
                </p>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                  Doctor?{" "}
                  <Link
                    to="/register/doctor"
                    style={{ color: "var(--brand-600)", fontWeight: 500, textDecoration: "none" }}
                  >
                    Register here
                  </Link>
                </p>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                  Admin?{" "}
                  <Link
                    to="/register/admin"
                    style={{ color: "var(--brand-600)", fontWeight: 500, textDecoration: "none" }}
                  >
                    Create admin account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
