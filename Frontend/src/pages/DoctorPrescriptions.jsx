import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { prescriptionAPI } from "../api/axios";

const DoctorPrescriptions = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await prescriptionAPI.get("/prescriptions/doctor/my");
      setPrescriptions(data);
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
        subtitle="View all prescriptions you have issued."
      />

      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      {loading ? (
        <div className="section-card">
          <p style={{ color: "var(--text-muted)" }}>Loading prescriptions...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="section-card">
          <EmptyState
            title="No prescriptions yet"
            description="You have not issued any prescriptions yet."
          />
        </div>
      ) : (
        <div className="grid-appointments">
          {prescriptions.map((item) => (
            <div key={item._id} className="appointment-card">
              <div className="appointment-card-header">
                <div>
                  <h3 className="appointment-card-title">
                    {item.patientSnapshot?.name || "Patient"}
                  </h3>
                  <p className="appointment-card-subtitle">
                    Prescription #{item.prescriptionId || "—"}
                  </p>
                </div>

                <span
                  className="badge"
                  style={{
                    background: item.isActive ? "#ecfdf5" : "#fef2f2",
                    color: item.isActive ? "#065f46" : "#991b1b",
                    border: `1px solid ${item.isActive ? "#a7f3d0" : "#fecaca"}`
                  }}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="meta-grid">
                <div className="meta-item">
                  <div className="meta-label">Appointment Date</div>
                  <div className="meta-value">
                    {item.appointmentSnapshot?.appointmentDate || "—"}
                  </div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Appointment Time</div>
                  <div className="meta-value">
                    {item.appointmentSnapshot?.appointmentTime || "—"}
                  </div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Diagnosis</div>
                  <div className="meta-value">{item.diagnosis || "—"}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Medicines</div>
                  <div className="meta-value">{item.medicines?.length || 0}</div>
                </div>
              </div>

              <div className="actions-row">
                <button
                  className="btn-primary"
                  onClick={() =>
                    navigate(`/doctor/prescriptions/appointment/${item.appointmentId}`)
                  }
                >
                  View / Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorPrescriptions;