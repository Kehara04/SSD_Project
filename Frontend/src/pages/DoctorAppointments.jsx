import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import AppointmentStatusBadge from "../components/AppointmentStatusBadge";
import { appointmentAPI, prescriptionAPI } from "../api/axios";

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    date: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [prescriptionMap, setPrescriptionMap] = useState({});

  const fetchPrescriptionAvailability = async (appointmentList) => {
    const results = {};

    await Promise.all(
      appointmentList.map(async (appointment) => {
        try {
          const { data } = await prescriptionAPI.get(
            `/prescriptions/doctor/appointment/${appointment._id}`
          );
          results[appointment._id] = data;
        } catch {
          results[appointment._id] = null;
        }
      })
    );

    setPrescriptionMap(results);
  };

  const fetchAppointments = async (customFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (customFilters.status) params.status = customFilters.status;
      if (customFilters.date) params.date = customFilters.date;

      const { data } = await appointmentAPI.get("/appointments/doctor/my", { params });
      setAppointments(data);
      await fetchPrescriptionAvailability(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctor appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const respondToAppointment = async (id, status) => {
    const note = window.prompt(
      status === "approved"
        ? "Add an optional approval note:"
        : "Add a rejection reason or note:"
    );

    if (note === null) return;

    setMessage("");
    setError("");
    try {
      await appointmentAPI.patch(`/appointments/${id}/respond`, {
        status,
        doctorResponseNote: note,
      });
      setMessage(`Appointment ${status} successfully.`);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} appointment`);
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

  const applyFilter = async () => {
    await fetchAppointments(filters);
  };

  const isVideoConsultation = (appointment) => {
    const raw = appointment?.consultationType;
    if (raw === true || raw === 1) return true;
    const value = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");
    if (!value) return false;
    return [
      "video",
      "video_consultation",
      "video_conference",
      "video_coference",
      "video_call",
      "videocall",
      "telemedicine",
      "online",
      "remote",
    ].includes(value) || value.includes("video");
  };

  const canAddPrescription = (appointment) => {
    return ["approved", "completed"].includes(appointment.status);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Doctor Appointments"
        subtitle="Review appointment requests, approve or reject them, and track patient bookings."
      />

      {message && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>{message}</div>}
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      <div className="section-card" style={{ marginBottom: "1.5rem" }}>
        <div className="filter-grid">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
        </div>

        <div className="actions-row" style={{ marginTop: "1rem" }}>
          <button className="btn-primary" onClick={applyFilter}>Apply Filters</button>
          <button
            className="btn-secondary"
            onClick={() => {
              const reset = { status: "", date: "" };
              setFilters(reset);
              fetchAppointments(reset);
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="section-card">
          <p style={{ color: "var(--text-muted)" }}>Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="section-card">
          <EmptyState
            title="No appointments found"
            description="No patient bookings match the selected filter."
          />
        </div>
      ) : (
        <div className="grid-appointments">
          {appointments.map((appointment) => {
            const prescription = prescriptionMap[appointment._id];

            return (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-card-header">
                  <div>
                    <h3 className="appointment-card-title">
                      {appointment.patientSnapshot?.name || "Patient"}
                    </h3>
                    <p className="appointment-card-subtitle">
                      {appointment.patientSnapshot?.email || "No email"} •{" "}
                      {appointment.patientSnapshot?.phone || "No phone"}
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
                    <div className="meta-label">Reason</div>
                    <div className="meta-value">{appointment.reason || "—"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Specialty</div>
                    <div className="meta-value">{appointment.specialty || "—"}</div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Visit type</div>
                    <div className="meta-value">
                      {isVideoConsultation(appointment)
                        ? "Video consultation"
                        : "In-person"}
                    </div>
                  </div>
                  <div className="meta-item">
                    <div className="meta-label">Prescription</div>
                    <div className="meta-value">
                      {prescription ? `#${prescription.prescriptionId}` : "Not added"}
                    </div>
                  </div>
                </div>

                {(appointment.notes || appointment.doctorResponseNote || appointment.cancellationReason) && (
                  <div className="soft-panel">
                    {appointment.notes && (
                      <p style={{ fontSize: "0.85rem", marginBottom: "0.35rem", color: "var(--text-secondary)" }}>
                        <strong>Patient Notes:</strong> {appointment.notes}
                      </p>
                    )}
                    {appointment.doctorResponseNote && (
                      <p style={{ fontSize: "0.85rem", marginBottom: "0.35rem", color: "var(--text-secondary)" }}>
                        <strong>Doctor Response:</strong> {appointment.doctorResponseNote}
                      </p>
                    )}
                    {appointment.cancellationReason && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <strong>Cancellation Reason:</strong> {appointment.cancellationReason}
                      </p>
                    )}
                  </div>
                )}

                {appointment.rescheduleHistory?.length > 0 && (
                  <div className="timeline-box">
                    <div className="timeline-title">Reschedule History</div>
                    {appointment.rescheduleHistory.map((item, index) => (
                      <div key={index} style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "0.45rem" }}>
                        {item.oldDate} {item.oldTime} → {item.newDate} {item.newTime}
                      </div>
                    ))}
                  </div>
                )}

                <div className="actions-row">
                  {isVideoConsultation(appointment) && (
                    <button
                      className="btn-primary"
                      onClick={() =>
                        navigate(`/doctor/telemedicine/${appointment._id}`, {
                          state: { appointment },
                        })
                      }
                    >
                      Video Consultation
                    </button>
                  )}

                  {canAddPrescription(appointment) && (
                    <button
                      className={prescription ? "btn-secondary" : "btn-primary"}
                      onClick={() =>
                        navigate(`/doctor/prescriptions/appointment/${appointment._id}`)
                      }
                    >
                      {prescription ? "View / Edit Prescription" : "Add Prescription"}
                    </button>
                  )}

                  {["pending", "rescheduled"].includes(appointment.status) && (
                    <>
                      <button
                        className="btn-primary"
                        onClick={() => respondToAppointment(appointment._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => respondToAppointment(appointment._id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {["pending", "approved", "rescheduled"].includes(appointment.status) && (
                    <button
                      className="btn-secondary"
                      onClick={() => cancelAppointment(appointment._id)}
                    >
                      Cancel
                    </button>
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

export default DoctorAppointments;