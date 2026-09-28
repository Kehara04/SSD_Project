import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import AppointmentStatusBadge from "../components/AppointmentStatusBadge";
import { appointmentAPI, paymentAPI, prescriptionAPI } from "../api/axios";

const PatientAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [paymentData, setPaymentData] = useState({});
  const [prescriptionMap, setPrescriptionMap] = useState({});

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentDate: "",
    appointmentTime: "",
    locationId: "",
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);

  const fetchPrescriptionStatuses = async (appointmentList) => {
    const results = {};

    await Promise.all(
      appointmentList.map(async (appointment) => {
        try {
          const { data } = await prescriptionAPI.get(
            `/prescriptions/patient/appointment/${appointment._id}`
          );
          results[appointment._id] = data;
        } catch {
          results[appointment._id] = null;
        }
      })
    );

    setPrescriptionMap(results);
  };

  const fetchPaymentStatuses = async (appointmentList) => {
    const approvedIds = appointmentList
      .filter((a) => a.status === "approved")
      .map((a) => a._id);

    if (approvedIds.length === 0) {
      setPaymentData({});
      return;
    }

    const results = {};
    await Promise.all(
      approvedIds.map(async (id) => {
        try {
          const { data } = await paymentAPI.get(`/payments/appointment/${id}`);
          results[id] = data;
        } catch {
          results[id] = null;
        }
      })
    );
    setPaymentData(results);
  };

  const fetchAppointments = async (status = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (status) params.status = status;

      const { data } = await appointmentAPI.get("/appointments/patient/my", { params });
      setAppointments(data);
      await Promise.all([fetchPaymentStatuses(data), fetchPrescriptionStatuses(data)]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const shouldShowVideoConsultation = (appointment) => {
    if (appointment.consultationType !== "video") return false;
    if (!["approved", "rescheduled", "completed"].includes(appointment.status)) return false;
    if (!appointment.appointmentDate || !appointment.appointmentTime) return false;

    const appointmentStart = new Date(
      `${appointment.appointmentDate}T${appointment.appointmentTime}:00`
    ).getTime();

    if (Number.isNaN(appointmentStart)) return false;

    const thirtyMinutesMs = 30 * 60 * 1000;
    return appointmentStart - nowMs <= thirtyMinutesMs;
  };

  const applyFilter = async () => {
    await fetchAppointments(statusFilter);
  };

  const fetchAvailableSlots = async (doctorId, date, locationId, currentAppointmentId) => {
    if (!doctorId || !date || !locationId) {
      setRescheduleSlots([]);
      return;
    }

    setSlotLoading(true);
    setError("");

    try {
      const { data } = await appointmentAPI.get(`/appointments/doctors/${doctorId}/slots`, {
        params: { date, locationId },
      });

      const normalizedSlots = (data?.slots || []).filter(
        (slot) => slot.isAvailable || slot.time === rescheduleForm.appointmentTime
      );

      setRescheduleSlots(normalizedSlots);
    } catch (err) {
      setRescheduleSlots([]);
      setError(err.response?.data?.message || "Failed to load available slots");
    } finally {
      setSlotLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    const reason = window.prompt("Enter cancellation reason:");
    if (reason === null) return;

    setMessage("");
    setError("");

    try {
      await appointmentAPI.patch(`/appointments/${id}/cancel`, {
        cancellationReason: reason,
      });
      setMessage("Appointment cancelled successfully.");
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const openReschedule = async (appointment) => {
    setMessage("");
    setError("");
    setRescheduleTarget(appointment);

    const currentDate = appointment.appointmentDate || "";
    const currentTime = appointment.appointmentTime || "";
    const currentLocationId = appointment.practiceLocationSnapshot?.locationId || "";

    setRescheduleForm({
      appointmentDate: currentDate,
      appointmentTime: currentTime,
      locationId: currentLocationId,
    });

    await fetchAvailableSlots(appointment.doctorId, currentDate, currentLocationId, appointment._id);
  };

  const closeReschedule = () => {
    setRescheduleTarget(null);
    setRescheduleForm({ appointmentDate: "", appointmentTime: "", locationId: "" });
    setRescheduleSlots([]);
    setSlotLoading(false);
  };

  const handleRescheduleFieldChange = async (e) => {
    const { name, value } = e.target;

    setRescheduleForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "appointmentDate" || name === "locationId" ? { appointmentTime: "" } : {}),
    }));

    const nextDate = name === "appointmentDate" ? value : rescheduleForm.appointmentDate;
    const nextLocationId = name === "locationId" ? value : rescheduleForm.locationId;

    if (rescheduleTarget?.doctorId && nextDate && nextLocationId && (name === "appointmentDate" || name === "locationId")) {
      await fetchAvailableSlots(rescheduleTarget.doctorId, nextDate, nextLocationId, rescheduleTarget._id);
    }
  };

  const selectSlot = (slot) => {
    setRescheduleForm((prev) => ({
      ...prev,
      appointmentTime: slot.time,
      locationId: slot.locationId || prev.locationId,
    }));
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!rescheduleForm.appointmentDate || !rescheduleForm.appointmentTime) {
      setError("Please choose a date and select an available slot.");
      return;
    }

    try {
      await appointmentAPI.patch(`/appointments/${rescheduleTarget._id}/reschedule`, {
        appointmentDate: rescheduleForm.appointmentDate,
        appointmentTime: rescheduleForm.appointmentTime,
        locationId: rescheduleForm.locationId,
      });

      setMessage("Appointment rescheduled successfully. Waiting for doctor confirmation.");
      closeReschedule();
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reschedule appointment");
    }
  };

  const getLocationName = (appointment) =>
    appointment.practiceLocationSnapshot?.locationName ||
    appointment.doctorSnapshot?.hospitalOrClinic ||
    "Clinic not added";

  return (
    <DashboardLayout>
      <PageHeader
        title="My Appointments"
        subtitle="View, track, cancel, reschedule, pay, and access prescriptions for your appointments."
      />

      {message && (
        <div className="alert-success" style={{ marginBottom: "1.25rem" }}>
          {message}
        </div>
      )}

      {error && (
        <div className="alert-error" style={{ marginBottom: "1.25rem" }}>
          {error}
        </div>
      )}

      {rescheduleTarget && (
        <div className="section-card" style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.1rem",
                  color: "var(--brand-800)",
                }}
              >
                Reschedule Appointment
              </h2>
              <p
                style={{
                  marginTop: "0.2rem",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                {rescheduleTarget.doctorSnapshot?.name || "Doctor"}
              </p>
            </div>
            <button className="btn-secondary" onClick={closeReschedule}>
              Close
            </button>
          </div>

          <form onSubmit={submitReschedule}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
              <div>
                <label className="label">Hospital / Clinic</label>
                <input
                  type="text"
                  className="input"
                  value={getLocationName(rescheduleTarget)}
                  readOnly
                />
              </div>

              <div>
                <label className="label">New Date</label>
                <input
                  type="date"
                  className="input"
                  name="appointmentDate"
                  value={rescheduleForm.appointmentDate}
                  onChange={handleRescheduleFieldChange}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Available Slots</label>
              {slotLoading ? (
                <p style={{ color: "var(--text-muted)" }}>Loading available slots...</p>
              ) : rescheduleSlots.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>No slots available for the selected date.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
                  {rescheduleSlots.map((slot) => {
                    const isSelected = rescheduleForm.appointmentTime === slot.time;
                    return (
                      <button
                        key={`${slot.locationId || "loc"}-${slot.time}`}
                        type="button"
                        disabled={!slot.isAvailable}
                        onClick={() => selectSlot(slot)}
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: "var(--radius-md)",
                          border: isSelected ? "2px solid var(--brand-500)" : "1px solid var(--brand-200)",
                          background: !slot.isAvailable ? "#f3f4f6" : isSelected ? "var(--brand-50)" : "#ffffff",
                          color: !slot.isAvailable ? "var(--text-muted)" : "var(--brand-800)",
                          fontWeight: 600,
                          cursor: !slot.isAvailable ? "not-allowed" : "pointer",
                        }}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Selected Time</label>
              <input type="text" className="input" value={rescheduleForm.appointmentTime} readOnly placeholder="Choose a slot above" />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-primary">Save Reschedule</button>
              <button type="button" className="btn-secondary" onClick={closeReschedule}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="section-card" style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.85rem",
            alignItems: "end",
          }}
        >
          <div style={{ minWidth: "220px" }}>
            <label className="label">Filter by Status</label>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button className="btn-primary" onClick={applyFilter}>
            Apply
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setStatusFilter("");
              fetchAppointments("");
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="section-card"><p style={{ color: "var(--text-muted)" }}>Loading appointments...</p></div>
      ) : appointments.length === 0 ? (
        <div className="section-card">
          <EmptyState title="No appointments yet" description="You have not booked any appointments yet." />
        </div>
      ) : (
        <div className="grid-appointments">
          {appointments.map((appointment) => {
            const prescription = prescriptionMap[appointment._id];
            const payment = paymentData[appointment._id];

            return (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-card-header">
                  <div>
                    <h3 className="appointment-card-title">{appointment.doctorSnapshot?.name || "Doctor"}</h3>
                    <p className="appointment-card-subtitle">
                      {appointment.doctorSnapshot?.specialization || "Specialist"} • {getLocationName(appointment)}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </div>

                <div className="meta-grid">
                  <div className="meta-item">
                    <div className="meta-label">Date</div>
                    <div className="meta-value">{appointment.appointmentDate || "—"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Time</div>
                    <div className="meta-value">{appointment.appointmentTime || "—"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Type</div>
                    <div className="meta-value">{appointment.consultationType === "video" ? "Video" : "In-person"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Fee</div>
                    <div className="meta-value">
                      {appointment.feeSnapshot?.finalFee || appointment.doctorSnapshot?.consultationFee
                        ? `LKR ${appointment.feeSnapshot?.finalFee || appointment.doctorSnapshot?.consultationFee}`
                        : "—"}
                    </div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Reason</div>
                    <div className="meta-value">{appointment.reason || "—"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Prescription</div>
                    <div className="meta-value">{prescription ? `#${prescription.prescriptionId}` : "Not available"}</div>
                  </div>
                </div>

                {(appointment.notes ||
                  appointment.doctorResponseNote ||
                  appointment.cancellationReason) && (
                    <div className="soft-panel">
                      {appointment.notes && (
                        <p
                          style={{
                            fontSize: "0.85rem",
                            marginBottom: "0.35rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <strong>Patient Notes:</strong> {appointment.notes}
                        </p>
                      )}
                      {appointment.doctorResponseNote && (
                        <p
                          style={{
                            fontSize: "0.85rem",
                            marginBottom: "0.35rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <strong>Doctor Response:</strong> {appointment.doctorResponseNote}
                        </p>
                      )}
                      {appointment.cancellationReason && (
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <strong>Cancellation Reason:</strong> {appointment.cancellationReason}
                        </p>
                      )}
                    </div>
                  )}

                {appointment.rescheduleHistory?.length > 0 && (
                  <div className="timeline-box">
                    <div className="timeline-title">Reschedule History</div>
                    {appointment.rescheduleHistory.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: "0.84rem",
                          color: "var(--text-secondary)",
                          marginBottom: "0.45rem",
                        }}
                      >
                        {item.oldDate} {item.oldTime} → {item.newDate} {item.newTime}
                      </div>
                    ))}
                  </div>
                )}

                <div className="actions-row">
                  {shouldShowVideoConsultation(appointment) && (
                    <button
                      className="btn-primary"
                      onClick={() => navigate(`/patient/telemedicine/${appointment._id}`, { state: { appointment } })}
                    >
                      Video Consultation
                    </button>
                  )}

                  {appointment.status === "approved" && (
                    payment?.status === "paid" ? (
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          navigate(`/payment/success?session_id=${payment.stripeSessionId}&appointmentId=${appointment._id}`);
                        }}
                      >
                        View Receipt
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/payment/${appointment._id}`)}
                      >
                        Pay Now
                      </button>
                    ))}

                  {prescription && (
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        navigate(`/patient/prescriptions?appointmentId=${appointment._id}`)
                      }
                    >
                      View Prescription
                    </button>
                  )}

                  {["pending", "approved", "rescheduled"].includes(appointment.status) && (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => openReschedule(appointment)}
                      >
                        Reschedule
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => cancelAppointment(appointment._id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientAppointments;
