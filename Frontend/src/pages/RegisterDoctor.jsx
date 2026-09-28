import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterShell from "./RegisterShell";
import { authAPI } from "../api/axios";

const RegisterDoctor = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      await authAPI.post("/auth/register/doctor", form);
      setSuccess("Doctor registration submitted. Awaiting admin verification.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Doctor registration failed");
    } finally { setSubmitting(false); }
  };

  return (
    <RegisterShell
      title="Doctor Registration"
      subtitle="Create a doctor account. Admin approval is required before public listing."
      icon="👨‍⚕️"
    >
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="label">Full Name</label>
          <input name="name" className="input" value={form.name} onChange={handleChange} placeholder="Dr. Samantha Perera" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" value={form.email} onChange={handleChange} placeholder="doctor@hospital.lk" required />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" value={form.phone} onChange={handleChange} placeholder="+94 77 000 0000" />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" className="input" value={form.password} onChange={handleChange} placeholder="••••••••" required />
        </div>

        <div
          style={{
            background: "var(--brand-50)",
            border: "1px solid var(--brand-200)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem 1rem",
            fontSize: "0.82rem",
            color: "var(--brand-700)",
          }}
        >
          ℹ️ After registration, an admin will verify your credentials before your profile becomes publicly visible.
        </div>

        <button className="btn-primary" style={{ width: "100%", padding: "0.7rem" }} disabled={submitting}>
          {submitting ? "Creating account…" : "Register as Doctor"}
        </button>
      </form>
    </RegisterShell>
  );
};

export default RegisterDoctor;