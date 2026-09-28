import { useState } from "react";
import { Link } from "react-router-dom";
import RegisterShell from "./RegisterShell";
import { authAPI } from "../api/axios";

// VULN-01: Only authenticated administrators can access this page (App.jsx).
// The backend independently enforces authentication and admin authorization.
const RegisterAdmin = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      // authAPI already attaches the logged-in admin's JWT through setAuthToken().
      // Do not send an adminSecret: the fixed backend does not use shared secrets.
      await authAPI.post("/auth/register/admin", form);
      setSuccess("Administrator account created successfully.");
      setForm({ name: "", email: "", password: "", phone: "" });
      // Keep the creating administrator logged in; do not redirect to /login.
    } catch (err) {
      setError(err.response?.data?.message || "Admin registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RegisterShell
      title="Create Administrator"
      subtitle="Only an authenticated administrator can create another administrator account."
    >
      {error && (
        <div className="alert-error" style={{ marginBottom: "1.25rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert-success" style={{ marginBottom: "1.25rem" }}>
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label className="label" htmlFor="admin-name">Full Name</label>
          <input
            id="admin-name"
            name="name"
            className="input"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            name="email"
            type="email"
            className="input"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="admin-phone">Phone</label>
          <input
            id="admin-phone"
            name="phone"
            className="input"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="label" htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            className="input"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>
        <button
          className="btn-primary"
          type="submit"
          style={{ width: "100%", padding: "0.7rem" }}
          disabled={submitting}
        >
          {submitting ? "Creating admin…" : "Create Administrator"}
        </button>
        <Link to="/admin/users" style={{ textAlign: "center" }}>
          Back to All Users
        </Link>
      </form>
    </RegisterShell>
  );
};

export default RegisterAdmin;
