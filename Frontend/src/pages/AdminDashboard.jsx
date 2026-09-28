import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import DoctorVerificationPanel from "../components/admin/DoctorVerificationPanel";
import AnalyticsSection from "../components/admin/AnalyticsSection";
import { authAPI, appointmentAPI, paymentAPI } from "../api/axios";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [usersRes, pendingRes] = await Promise.all([
        authAPI.get("/admin/users"),
        authAPI.get("/admin/doctors/pending"),
      ]);

      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setPendingDoctors(Array.isArray(pendingRes.data) ? pendingRes.data : []);
    } catch (err) {
      console.error("Admin user fetch failed", err.message || err);
      setError(err.response?.data?.message || "Failed to load admin user data");
    }

    try {
      const appointmentRes = await appointmentAPI.get("/appointments/admin/all");
      setAppointments(Array.isArray(appointmentRes.data) ? appointmentRes.data : appointmentRes.data.appointments || []);
    } catch (err) {
      console.error("Appointment admin fetch failed", err.message || err);
      setAppointments([]);
    }

    try {
      const paymentRes = await paymentAPI.get("/payments/admin/all");
      setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : paymentRes.data.payments || []);
    } catch (err) {
      console.error("Payment admin fetch failed", err.message || err);
      setPayments([]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const verifyDoctor = async (id, status) => {
    setMessage(""); setError("");
    try {
      await authAPI.patch(`/admin/doctors/${id}/verify`, { status });
      setMessage(`Doctor ${status} successfully.`);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Doctor verification failed"); }
  };

  const toggleUser = async (id, isActive) => {
    setMessage(""); setError("");
    try {
      const endpoint = isActive ? `/admin/users/${id}/deactivate` : `/admin/users/${id}/activate`;
      await authAPI.patch(endpoint);
      setMessage(`User ${isActive ? "deactivated" : "activated"} successfully.`);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "User status update failed"); }
  };

  const totalPatients = users.filter((u) => u.role === "patient").length;
  const totalDoctors = users.filter((u) => u.role === "doctor").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--brand-100)",
    boxShadow: "var(--shadow-sm)",
    padding: "1.5rem",
  };

  const detailRowStyle = {
    background: "var(--brand-50)",
    border: "1px solid var(--brand-100)",
    borderRadius: "var(--radius-md)",
    padding: "1rem 1.25rem",
    marginBottom: "0.75rem",
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage users and verify doctor registrations."
      />

      {message && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>{message}</div>}
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard title="Total Users" value={users.length} />
        <StatCard title="Patients" value={totalPatients} />
        <StatCard title="Doctors" value={totalDoctors} />
        <StatCard title="Admins" value={totalAdmins} />
        <StatCard title="Appointments" value={appointments.length} />
        <StatCard title="Transactions" value={payments.length} />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <DoctorVerificationPanel
          pendingDoctors={pendingDoctors}
          loading={loading}
          onVerify={verifyDoctor}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <AnalyticsSection
          appointments={appointments}
          payments={payments}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;