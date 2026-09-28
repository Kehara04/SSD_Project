const axios = require("axios");

const APPOINTMENT_SERVICE_URL =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003";
const SERVICE_SECRET = process.env.SERVICE_SECRET || "";

const getAppointmentNotificationPayload = async (appointmentId) => {
  if (!appointmentId) {
    throw new Error("appointmentId is required");
  }

  console.log("APPOINTMENT_SERVICE_URL:", APPOINTMENT_SERVICE_URL);
  console.log("Notification SERVICE_SECRET:", SERVICE_SECRET);

  const response = await axios.get(
    `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/notification`,
    {
      headers: {
        "x-service-secret": SERVICE_SECRET,
      },
    }
  );

  return response.data;
};

module.exports = {
  getAppointmentNotificationPayload,
};