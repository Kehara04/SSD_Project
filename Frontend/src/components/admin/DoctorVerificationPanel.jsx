import EmptyState from "../EmptyState";

const DoctorVerificationPanel = ({ pendingDoctors = [], loading, onVerify }) => {
  const cardStyle = {
    background: "#ffffff",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--brand-100)",
    boxShadow: "var(--shadow-sm)",
    padding: "1.5rem",
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
        <div style={{ width: "8px", height: "8px", background: "#0ea5e9", borderRadius: "50%" }} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 600, color: "var(--brand-800)" }}>
          Doctor Approval Workflow
        </h2>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading pending doctors…</p>
      ) : pendingDoctors.length === 0 ? (
        <EmptyState title="No doctors awaiting approval" description="All pending doctor registrations have been reviewed." />
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {pendingDoctors.map((doctor) => (
            <div key={doctor.id} style={{ background: "#f8fafc", borderRadius: "var(--radius-md)", border: "1px solid var(--brand-100)", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--brand-800)" }}>{doctor.name}</h3>
                  <p style={{ margin: "0.35rem 0 0", color: "var(--text-secondary)", fontSize: "0.86rem" }}>{doctor.email}</p>
                </div>
                <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: "999px", padding: "0.25rem 0.65rem", fontSize: "0.75rem", fontWeight: 600, height: "fit-content" }}>
                  {doctor.doctorVerificationStatus || "pending"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.8rem", marginTop: "1rem" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Specialization</p>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--brand-700)" }}>{doctor.profile?.specialization || "Not available"}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Clinic / Hospital</p>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--brand-700)" }}>{doctor.profile?.hospital || doctor.profile?.hospitalOrClinic || "Not available"}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Phone</p>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--brand-700)" }}>{doctor.phone || "—"}</p>
                </div>
              </div>
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  style={{ padding: "0.45rem 0.95rem", fontSize: "0.82rem" }}
                  onClick={() => onVerify(doctor.id, "approved")}
                >
                  Approve Doctor
                </button>
                <button
                  className="btn-danger"
                  style={{ padding: "0.45rem 0.95rem", fontSize: "0.82rem" }}
                  onClick={() => onVerify(doctor.id, "rejected")}
                >
                  Reject Doctor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorVerificationPanel;