import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterShell from "./RegisterShell";
import { authAPI } from "../api/axios";

const RegisterAdmin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", adminSecret: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      await authAPI.post("/auth/register/admin", form);
      setSuccess("Admin registration successful.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Admin registration failed");
    } finally { setSubmitting(false); }
  };

  return (
    <RegisterShell
      title="Admin Registration"
      subtitle="Create an admin account for verification and user management."
      icon="🛡️"
    >
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="label">Full Name</label>
          <input name="name" className="input" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" className="input" value={form.password} onChange={handleChange} required />
        </div>
        <div>
          <label className="label">Admin Secret</label>
          <input name="adminSecret" className="input" value={form.adminSecret} onChange={handleChange} placeholder="Enter the admin secret key" required />
        </div>
        <button className="btn-primary" style={{ width: "100%", padding: "0.7rem" }} disabled={submitting}>
          {submitting ? "Creating admin…" : "Register Admin"}
        </button>
      </form>
    </RegisterShell>
  );
};

export default RegisterAdmin;