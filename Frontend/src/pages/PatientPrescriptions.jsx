import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import PrescriptionViewCard from "../components/PrescriptionViewCard";
import { prescriptionAPI } from "../api/axios";

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await prescriptionAPI.get("/prescriptions/patient/my");
      setPrescriptions(data);
      setSelected(data[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title="My Prescriptions"
        subtitle="Review your prescriptions issued by doctors."
      />

      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      {loading ? (
        <div className="section-card">
          <p style={{ color: "var(--text-muted)" }}>Loading prescriptions...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="section-card">
          <EmptyState
            title="No prescriptions available"
            description="Prescriptions linked to your appointments will appear here."
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem" }} className="doctor-grid">
          <div className="section-card" style={{ height: "fit-content" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.05rem",
                color: "var(--brand-800)",
                marginBottom: "1rem",
              }}
            >
              Prescription List
            </h2>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              {prescriptions.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelected(item)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                    border:
                      selected?._id === item._id
                        ? "1.5px solid var(--brand-400)"
                        : "1px solid var(--brand-100)",
                    background:
                      selected?._id === item._id ? "var(--brand-50)" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <p style={{ fontWeight: 700, color: "var(--brand-800)", marginBottom: "0.25rem" }}>
                    #{item.prescriptionId} · {item.doctorSnapshot?.name || "Doctor"}
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {item.appointmentSnapshot?.appointmentDate || "—"} ·{" "}
                    {item.appointmentSnapshot?.appointmentTime || "—"}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                    {item.diagnosis || "No diagnosis"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <PrescriptionViewCard prescription={selected} />
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientPrescriptions;