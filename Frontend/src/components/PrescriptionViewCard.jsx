const PrescriptionViewCard = ({ prescription }) => {
  if (!prescription) return null;

  return (
    <div className="section-card" style={{ maxWidth: "900px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.25rem",
          borderBottom: "1px solid var(--brand-100)",
          paddingBottom: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              color: "var(--brand-800)",
            }}
          >
            Prescription #{prescription.prescriptionId || "—"}
          </h2>
          <p style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Issued on{" "}
            {prescription.issuedAt
              ? new Date(prescription.issuedAt).toLocaleString()
              : "—"}
          </p>
        </div>

        <span
          className="badge"
          style={{
            background: prescription.isActive ? "#ecfdf5" : "#fef2f2",
            color: prescription.isActive ? "#065f46" : "#991b1b",
            border: `1px solid ${prescription.isActive ? "#a7f3d0" : "#fecaca"}`
          }}
        >
          {prescription.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="meta-grid" style={{ marginBottom: "1.25rem" }}>
        <div className="meta-item">
          <div className="meta-label">Patient</div>
          <div className="meta-value">{prescription.patientSnapshot?.name || "—"}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Doctor</div>
          <div className="meta-value">{prescription.doctorSnapshot?.name || "—"}</div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Specialization</div>
          <div className="meta-value">
            {prescription.doctorSnapshot?.specialization || "—"}
          </div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Appointment Date</div>
          <div className="meta-value">
            {prescription.appointmentSnapshot?.appointmentDate || "—"}
          </div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Appointment Time</div>
          <div className="meta-value">
            {prescription.appointmentSnapshot?.appointmentTime || "—"}
          </div>
        </div>
        <div className="meta-item">
          <div className="meta-label">Consultation Type</div>
          <div className="meta-value">
            {prescription.appointmentSnapshot?.consultationType === "video"
              ? "Video consultation"
              : "In-person"}
          </div>
        </div>
      </div>

      <div className="soft-panel" style={{ marginBottom: "1rem" }}>
        <p style={{ fontWeight: 600, color: "var(--brand-700)", marginBottom: "0.35rem" }}>
          Diagnosis
        </p>
        <p style={{ color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
          {prescription.diagnosis || "—"}
        </p>
      </div>

      {prescription.symptoms && (
        <div className="soft-panel" style={{ marginBottom: "1rem" }}>
          <p style={{ fontWeight: 600, color: "var(--brand-700)", marginBottom: "0.35rem" }}>
            Symptoms
          </p>
          <p style={{ color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
            {prescription.symptoms}
          </p>
        </div>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            fontSize: "1rem",
            color: "var(--brand-800)",
            marginBottom: "0.75rem",
            fontWeight: 700,
          }}
        >
          Medicines
        </h3>

        {!prescription.medicines?.length ? (
          <div className="soft-panel">
            <p style={{ color: "var(--text-secondary)" }}>No medicines added.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {prescription.medicines.map((medicine, index) => (
              <div
                key={index}
                style={{
                  background: "#fff",
                  border: "1px solid var(--brand-100)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  borderLeft: "4px solid var(--brand-400)",
                }}
              >
                <p style={{ fontWeight: 700, color: "var(--brand-800)", marginBottom: "0.5rem" }}>
                  {medicine.medicineName}
                </p>

                <div className="meta-grid">
                  <div className="meta-item">
                    <div className="meta-label">Dosage</div>
                    <div className="meta-value">{medicine.dosage || "—"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Frequency</div>
                    <div className="meta-value">{medicine.frequency || "—"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Duration</div>
                    <div className="meta-value">{medicine.duration || "—"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Instructions</div>
                    <div className="meta-value">{medicine.instructions || "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {prescription.advice && (
        <div className="soft-panel" style={{ marginBottom: "1rem" }}>
          <p style={{ fontWeight: 600, color: "var(--brand-700)", marginBottom: "0.35rem" }}>
            Advice
          </p>
          <p style={{ color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
            {prescription.advice}
          </p>
        </div>
      )}

      {prescription.notes && (
        <div className="soft-panel" style={{ marginBottom: "1rem" }}>
          <p style={{ fontWeight: 600, color: "var(--brand-700)", marginBottom: "0.35rem" }}>
            Notes
          </p>
          <p style={{ color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
            {prescription.notes}
          </p>
        </div>
      )}

      {prescription.followUpDate && (
        <div className="soft-panel">
          <p style={{ fontWeight: 600, color: "var(--brand-700)", marginBottom: "0.35rem" }}>
            Follow-up Date
          </p>
          <p style={{ color: "var(--text-secondary)" }}>{prescription.followUpDate}</p>
        </div>
      )}
    </div>
  );
};

export default PrescriptionViewCard;