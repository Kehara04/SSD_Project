import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterShell from "./RegisterShell";
import { authAPI } from "../api/axios";

const RegisterPatient = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    nic: "",
    email: "",
    password: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "nic" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await authAPI.post("/auth/register/patient", form);
      setSuccess("Registration successful! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RegisterShell
      title="Patient Registration"
      subtitle="Create a patient account to manage your healthcare profile."
      icon="🩺"
    >
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}
      {success && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label className="label">Full Name</label>
          <input
            name="name"
            className="input"
            value={form.name}
            onChange={handleChange}
            placeholder="John Silva"
            required
          />
        </div>

        <div>
          <label className="label">NIC</label>
          <input
            name="nic"
            className="input"
            value={form.nic}
            onChange={handleChange}
            placeholder="200012345678 or 991234567V"
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            name="email"
            type="email"
            className="input"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="label">Phone</label>
          <input
            name="phone"
            className="input"
            value={form.phone}
            onChange={handleChange}
            placeholder="+94 77 000 0000"
          />
        </div>

        <div>
          <label className="label">Password</label>
          <input
            name="password"
            type="password"
            className="input"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />
        </div>

        <button
          className="btn-primary"
          style={{ width: "100%", marginTop: "0.5rem", padding: "0.7rem" }}
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Register as Patient"}
        </button>
      </form>
    </RegisterShell>
  );
};

export default RegisterPatient;