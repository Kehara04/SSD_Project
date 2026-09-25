const crypto = require("crypto");
const Session = require("../models/Session");
const axios = require("axios");

// Match the verified JWT identity to the participant for that role.
const isParticipant = (user, resource) => {
  if (!user?.id) return false;
  const participantId = user.role === "patient"
    ? resource.patientId
    : user.role === "doctor" ? resource.doctorId : null;
  return participantId != null && String(participantId) === String(user.id);
};

const getNotificationServiceUrl = () =>
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5007";

const getAppointmentServiceUrl = () =>
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003";

const getServiceSecret = () => process.env.SERVICE_SECRET || "";

const generateRoomName = (appointmentId) => {
  const random = crypto.randomBytes(4).toString("hex");
  return `consult-${appointmentId}-${random}`;
};

const fetchAppointmentPayload = async (appointmentId) => {
  try {
    const response = await axios.get(
      `${getAppointmentServiceUrl()}/api/appointments/internal/${appointmentId}/notification`,
      {
        headers: {
          "x-service-secret": getServiceSecret(),
        },
        timeout: 5000,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "fetchAppointmentPayload failed:",
      error.code,
      error.response?.status,
      error.response?.data || error.message
    );
    throw error;
  }
};

const sendCompletionNotification = async (session) => {
  try {
    const appointment = await fetchAppointmentPayload(session.appointmentId);

    const patient = appointment?.patientSnapshot || {};
    const doctor = appointment?.doctorSnapshot || {};

    if (!patient.email && !patient.phone) {
      console.warn("Completion notification skipped: patient contact not found");
      return;
    }

    await axios.post(`${getNotificationServiceUrl()}/api/notifications/completion`, {
      email: patient.email,
      phone: patient.phone,
      doctorName: doctor.name || "Doctor",
      date: session.scheduledStartTime
        ? new Date(session.scheduledStartTime).toISOString().slice(0, 10)
        : undefined,
      time: session.scheduledStartTime
        ? new Date(session.scheduledStartTime).toTimeString().slice(0, 5)
        : undefined,
    });
  } catch (notifyError) {
    console.error("Completion notification failed:", notifyError.message);
  }
};

// CREATE VIDEO SESSION
const createSession = async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId, scheduledStartTime } = req.body;

    if (!appointmentId || !doctorId || !patientId) {
      return res.status(400).json({
        message: "appointmentId, doctorId and patientId are required",
      });
    }

    let appointment;
    try {
      appointment = await fetchAppointmentPayload(appointmentId);
    } catch (error) {
      return res.status(error.response?.status || 502).json({
        message:
          error.response?.data?.message ||
          error.code ||
          "Failed to fetch appointment from appointment-service",
      });
    }

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Authorize against the trusted appointment, never caller-supplied IDs.
    if (!isParticipant(req.user, appointment)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    if (
      String(appointment.doctorId) !== String(doctorId) ||
      String(appointment.patientId) !== String(patientId)
    ) {
      return res.status(400).json({
        message: "doctorId or patientId does not match the appointment",
      });
    }

    const existingSession = await Session.findOne({ appointmentId });
    if (existingSession) {
      if (!isParticipant(req.user, existingSession)) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }
      return res.status(200).json(existingSession);
    }

    const roomName = generateRoomName(appointmentId);
    const meetingUrl = `https://meet.jit.si/${roomName}`;

    const session = await Session.create({
      appointmentId,
      doctorId: String(appointment.doctorId),
      patientId: String(appointment.patientId),
      roomName,
      meetingUrl,
      scheduledStartTime,
    });

    return res.status(201).json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET SESSION BY APPOINTMENT
const getSessionByAppointment = async (req, res) => {
  try {
    const session = await Session.findOne({
      appointmentId: req.params.appointmentId,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!isParticipant(req.user, session)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// JOIN SESSION
const joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!isParticipant(req.user, session)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    session.status = "active";

    if (!session.actualStartTime) {
      session.actualStartTime = new Date();
    }

    await session.save();

    return res.json({
      meetingUrl: session.meetingUrl,
      status: session.status,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// END SESSION
const endSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!isParticipant(req.user, session)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    session.status = "completed";
    session.actualEndTime = new Date();

    await session.save();
    await sendCompletionNotification(session);

    return res.json(session);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSession,
  getSessionByAppointment,
  joinSession,
  endSession,
};
