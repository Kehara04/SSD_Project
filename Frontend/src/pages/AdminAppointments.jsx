import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import AppointmentMonitoring from "../components/admin/AppointmentMonitoring";
import { appointmentAPI } from "../api/axios";

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await appointmentAPI.get("/appointments/admin/all");
        setAppointments(Array.isArray(response.data) ? response.data : response.data.appointments || []);
      } catch (err) {
        console.error("Admin appointments fetch failed", err.message || err);
        setError(err.response?.data?.message || "Unable to load appointment records.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title="Appointment Monitoring"
        subtitle="View all appointments and status metrics from the admin panel."
      />
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}
      <AppointmentMonitoring appointments={appointments} loading={loading} />
    </DashboardLayout>
  );
};

export default AdminAppointments;
