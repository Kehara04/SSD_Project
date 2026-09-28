import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import PrescriptionViewCard from "../components/PrescriptionViewCard";
import { appointmentAPI, prescriptionAPI } from "../api/axios";

const emptyMedicine = {
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

const AppointmentPrescriptions = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [prescription, setPrescription] = useState(null);

  const [loadingAppointment, setLoadingAppointment] = useState(true);
  const [loadingPrescription, setLoadingPrescription] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    diagnosis: "",
    symptoms: "",
    medicines: [{ ...emptyMedicine }],
    advice: "",
    notes: "",
    followUpDate: "",
    isActive: true,
  });

  const canWritePrescription = useMemo(() => {
    return ["approved", "completed"].includes(appointment?.status);
  }, [appointment]);

  const loadFormFromPrescription = (data) => {
    setForm({
      diagnosis: data?.diagnosis || "",
      symptoms: data?.symptoms || "",
      medicines: data?.medicines?.length ? data.medicines : [{ ...emptyMedicine }],
      advice: data?.advice || "",
      notes: data?.notes || "",
      followUpDate: data?.followUpDate || "",
      isActive: data?.isActive ?? true,
    });
  };

  const fetchAppointment = async () => {
    setLoadingAppointment(true);
    try {
      const { data } = await appointmentAPI.get(`/appointments/${appointmentId}`);
      setAppointment(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointment");
    } finally {
      setLoadingAppointment(false);
    }
  };

  const fetchPrescription = async () => {
    setLoadingPrescription(true);
    try {
      const { data } = await prescriptionAPI.get(
        `/prescriptions/doctor/appointment/${appointmentId}`
      );
      setPrescription(data);
      loadFormFromPrescription(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || "Failed to load prescription");
      } else {
        setPrescription(null);
        loadFormFromPrescription(null);
      }
    } finally {
      setLoadingPrescription(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
    fetchPrescription();
  }, [appointmentId]);

  const handleChange = (e) => {
    setMessage("");
    setError("");
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addMedicine = () => {
    setForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { ...emptyMedicine }],
    }));
  };

  const removeMedicine = (index) => {
    setForm((prev) => {
      const next = prev.medicines.filter((_, i) => i !== index);
      return {
        ...prev,
        medicines: next.length ? next : [{ ...emptyMedicine }],
      };
    });
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        diagnosis: form.diagnosis,
        symptoms: form.symptoms,
        medicines: form.medicines,
        advice: form.advice,
        notes: form.notes,
        followUpDate: form.followUpDate,
      };

      const { data } = await prescriptionAPI.post(
        `/prescriptions/doctor/appointment/${appointmentId}`,
        payload
      );

      setPrescription(data.prescription);
      loadFormFromPrescription(data.prescription);
      setEditing(false);
      setMessage("Prescription created successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create prescription");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePrescription = async (e) => {
    e.preventDefault();
    if (!prescription?._id) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        diagnosis: form.diagnosis,
        symptoms: form.symptoms,
        medicines: form.medicines,
        advice: form.advice,
        notes: form.notes,
        followUpDate: form.followUpDate,
        isActive: form.isActive,
      };

      const { data } = await prescriptionAPI.put(
        `/prescriptions/doctor/${prescription._id}`,
        payload
      );

      setPrescription(data.prescription);
      loadFormFromPrescription(data.prescription);
      setEditing(false);
      setMessage("Prescription updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update prescription");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    if (prescription) loadFormFromPrescription(prescription);
    setEditing(true);
  };

  const cancelEdit = () => {
    if (prescription) loadFormFromPrescription(prescription);
    else loadFormFromPrescription(null);
    setEditing(false);
    setError("");
    setMessage("");
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Appointment Prescription"
        subtitle="Create, review, and update prescription details for this appointment."
      />

      {message && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>{message}</div>}
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      {(loadingAppointment || loadingPrescription) ? (
        <div className="section-card">
          <p style={{ color: "var(--text-muted)" }}>Loading prescription details...</p>
        </div>
      ) : (
        <>
          <div className="section-card" style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "0.85rem",
              }}
            >
              <div className="meta-item">
                <div className="meta-label">Patient</div>
                <div className="meta-value">{appointment?.patientSnapshot?.name || "—"}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Appointment Date</div>
                <div className="meta-value">{appointment?.appointmentDate || "—"}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Appointment Time</div>
                <div className="meta-value">{appointment?.appointmentTime || "—"}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Status</div>
                <div className="meta-value">{appointment?.status || "—"}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Specialty</div>
                <div className="meta-value">{appointment?.specialty || "—"}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Consultation Type</div>
                <div className="meta-value">
                  {appointment?.consultationType === "video" ? "Video consultation" : "In-person"}
                </div>
              </div>
            </div>
          </div>

          {!prescription && !editing && (
            <div className="section-card">
              {!canWritePrescription ? (
                <div className="alert-error">
                  Prescription can only be added for approved or completed appointments.
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h2
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.1rem",
                        color: "var(--brand-800)",
                      }}
                    >
                      No prescription yet
                    </h2>
                    <p style={{ marginTop: "0.25rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                      Create a new prescription for this appointment.
                    </p>
                  </div>

                  <button className="btn-primary" onClick={() => setEditing(true)}>
                    Add Prescription
                  </button>
                </div>
              )}
            </div>
          )}

          {prescription && !editing && (
            <>
              <div style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className="btn-primary" onClick={openEdit}>
                  Edit Prescription
                </button>
                <button className="btn-secondary" onClick={() => navigate("/doctor/prescriptions")}>
                  View All Prescriptions
                </button>
              </div>

              <PrescriptionViewCard prescription={prescription} />
            </>
          )}

          {editing && (
            <form
              onSubmit={prescription ? handleUpdatePrescription : handleCreatePrescription}
              className="section-card"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                  marginBottom: "1.25rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.15rem",
                      color: "var(--brand-800)",
                    }}
                  >
                    {prescription ? "Edit Prescription" : "Create Prescription"}
                  </h2>
                  <p style={{ marginTop: "0.2rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Appointment and patient details are linked automatically.
                  </p>
                </div>

                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>

              <div className="form-grid-2">
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Diagnosis</label>
                  <textarea
                    name="diagnosis"
                    rows="3"
                    className="input"
                    value={form.diagnosis}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Symptoms</label>
                  <textarea
                    name="symptoms"
                    rows="3"
                    className="input"
                    value={form.symptoms}
                    onChange={handleChange}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <label className="label" style={{ marginBottom: 0 }}>Medicines</label>
                    <button type="button" className="btn-secondary" onClick={addMedicine}>
                      + Add Medicine
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: "0.85rem" }}>
                    {form.medicines.map((medicine, index) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid var(--brand-100)",
                          borderRadius: "var(--radius-md)",
                          padding: "1rem",
                          background: "var(--brand-50)",
                        }}
                      >
                        <div className="form-grid-2">
                          <div>
                            <label className="label">Medicine Name</label>
                            <input
                              className="input"
                              value={medicine.medicineName}
                              onChange={(e) =>
                                handleMedicineChange(index, "medicineName", e.target.value)
                              }
                              required
                            />
                          </div>

                          <div>
                            <label className="label">Dosage</label>
                            <input
                              className="input"
                              value={medicine.dosage}
                              onChange={(e) =>
                                handleMedicineChange(index, "dosage", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="label">Frequency</label>
                            <input
                              className="input"
                              value={medicine.frequency}
                              onChange={(e) =>
                                handleMedicineChange(index, "frequency", e.target.value)
                              }
                            />
                          </div>

                          <div>
                            <label className="label">Duration</label>
                            <input
                              className="input"
                              value={medicine.duration}
                              onChange={(e) =>
                                handleMedicineChange(index, "duration", e.target.value)
                              }
                            />
                          </div>

                          <div style={{ gridColumn: "1 / -1" }}>
                            <label className="label">Instructions</label>
                            <input
                              className="input"
                              value={medicine.instructions}
                              onChange={(e) =>
                                handleMedicineChange(index, "instructions", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: "0.85rem" }}>
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => removeMedicine(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Advice</label>
                  <textarea
                    name="advice"
                    rows="3"
                    className="input"
                    value={form.advice}
                    onChange={handleChange}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="label">Notes</label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="input"
                    value={form.notes}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="label">Follow-up Date</label>
                  <input
                    type="date"
                    name="followUpDate"
                    className="input"
                    value={form.followUpDate}
                    onChange={handleChange}
                  />
                </div>

                {prescription && (
                  <div style={{ display: "flex", alignItems: "end" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.65rem",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        marginBottom: "0.55rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                      />
                      Prescription Active
                    </label>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className="btn-primary" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : prescription
                    ? "Update Prescription"
                    : "Create Prescription"}
                </button>
                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AppointmentPrescriptions;