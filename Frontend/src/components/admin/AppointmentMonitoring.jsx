import { useMemo, useState } from "react";
import EmptyState from "../EmptyState";

const statusColors = {
  pending: { bg: "#fef3c7", color: "#92400e" },
  approved: { bg: "#dcfce7", color: "#166534" },
  completed: { bg: "#ecfdf5", color: "#0f766e" },
  cancelled: { bg: "#fee2e2", color: "#991b1b" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
  rescheduled: { bg: "#e0f2fe", color: "#075985" },
};

const formatDate = (value) => {
  if (!value) return "—";
  return value.split("T")[0];
};

const AppointmentMonitoring = ({ appointments = [], loading }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const patientName = appointment.patientSnapshot?.name || appointment.patientName || "";
      const doctorName = appointment.doctorSnapshot?.name || appointment.doctorName || "";
      const combinedText = `${patientName} ${doctorName}`.toLowerCase();
      return !normalizedSearch || combinedText.includes(normalizedSearch);
    });
  }, [appointments, searchTerm]);

  const totals = filteredAppointments.reduce(
    (acc, appointment) => {
      acc.total += 1;
      const status = appointment.status || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, completed: 0, cancelled: 0, rejected: 0, rescheduled: 0 }
  );

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--brand-100)",
    boxShadow: "var(--shadow-sm)",
    padding: "1.5rem",
  };

  const metricStyle = {
    background: "var(--brand-50)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--brand-100)",
    padding: "1rem",
    textAlign: "center",
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
        <div style={{ width: "8px", height: "8px", background: "#06b6d4", borderRadius: "50%" }} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 600, color: "var(--brand-800)" }}>
          Appointment Monitoring
        </h2>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: "220px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>Search patient or doctor</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type name to filter"
            style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "0.75rem", border: "1px solid var(--brand-100)", background: "#ffffff", color: "var(--text-primary)" }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={metricStyle}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Total Appointments</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-700)" }}>{totals.total}</p>
        </div>
        <div style={metricStyle}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Pending</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#92400e" }}>{totals.pending}</p>
        </div>
        <div style={metricStyle}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Approved</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#065f46" }}>{totals.approved}</p>
        </div>
        <div style={metricStyle}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Rejected</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#991b1b" }}>{totals.rejected}</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading appointment metrics…</p>
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments yet" description="No appointment records are available from the system." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
            <thead>
              <tr>
                {['Patient', 'Doctor', 'Date', 'Time', 'Status', 'Type'].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: "0.85rem 0.75rem", color: "var(--text-secondary)", fontSize: "0.8rem", borderBottom: "1px solid var(--brand-100)" }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.slice(0, 8).map((appointment) => {
                const status = appointment.status || "pending";
                const badge = statusColors[status] || { bg: "#e2e8f0", color: "#334155" };
                return (
                  <tr key={appointment._id || appointment.id}>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-primary)" }}>
                      {appointment.patientSnapshot?.name || appointment.patientName || "Unknown"}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-primary)" }}>
                      {appointment.doctorSnapshot?.name || appointment.doctorName || "Unknown"}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-secondary)" }}>
                      {formatDate(appointment.appointmentDate || appointment.date)}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-secondary)" }}>
                      {appointment.appointmentTime || appointment.time || "—"}
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.3rem 0.6rem", borderRadius: "999px", background: badge.bg, color: badge.color, fontSize: "0.75rem", fontWeight: 600 }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-secondary)" }}>
                      {appointment.consultationType || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AppointmentMonitoring;