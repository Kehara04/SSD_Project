import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import {
  getSessionByAppointment,
  createSession,
  joinSession,
  endSession,
} from "../services/telemedicineService";

const TelemedicinePage = () => {
  const { appointmentId } = useParams();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getSessionByAppointment(appointmentId);
        setSession(data);
      } catch (err) {
        // If no session exists yet, try creating one from appointment context passed via navigation state.
        if (err.response?.status === 404 && location.state?.appointment) {
          try {
            const appointment = location.state.appointment;
            const created = await createSession({
              appointmentId,
              doctorId: appointment.doctorId,
              patientId: appointment.patientId,
              scheduledStartTime:
                appointment.appointmentDate && appointment.appointmentTime
                  ? new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`)
                  : undefined,
            });
            setSession(created);
            return;
          } catch (createErr) {
            setError(createErr.response?.data?.message || "Failed to create telemedicine session");
            return;
          }
        }
        setError(err.response?.data?.message || err.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      loadSession();
    } else {
      setLoading(false);
      setError("Missing appointment id.");
    }
  }, [appointmentId, location.state]);

  const handleJoin = async () => {
    try {
      const result = await joinSession(session._id);
      setSession((prev) => ({ ...prev, status: "active" }));
      window.open(result.meetingUrl, "_blank");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join session");
    }
  };

  const handleEnd = async () => {
    try {
      const result = await endSession(session._id);
      setSession(result);
      alert("Session ended");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to end session");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Telemedicine Consultation" subtitle="Loading session..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Telemedicine Consultation"
        subtitle="Join and manage your video consultation session."
      />

      {error && <div className="alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {!session ? (
        <div className="section-card">
          <p style={{ color: "var(--text-secondary)" }}>
            Session is not available yet for this appointment.
          </p>
        </div>
      ) : (
        <div className="section-card">
          <p><b>Appointment:</b> {session.appointmentId}</p>
          <p><b>Status:</b> {session.status}</p>

          <div className="actions-row" style={{ marginTop: "1rem" }}>
            <button className="btn-primary" onClick={handleJoin}>Join Consultation</button>

            {session.status === "active" && (
              <button className="btn-danger" onClick={handleEnd}>
                End Session
              </button>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TelemedicinePage;