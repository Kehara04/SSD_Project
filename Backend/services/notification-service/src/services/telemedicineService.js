const axios = require("axios");

const getTelemedicineServiceUrl = () =>
  process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5004";

const getVideoMeetingUrlForAppointment = async ({
  appointmentId,
  doctorId,
  patientId,
  scheduledStartTime,
}) => {
  if (!appointmentId) {
    throw new Error("appointmentId is required");
  }

  try {
    const existing = await axios.get(
      `${getTelemedicineServiceUrl()}/api/sessions/appointment/${appointmentId}`,
      {
        timeout: 5000,
      }
    );

    if (existing?.data?.meetingUrl) {
      return existing.data.meetingUrl;
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }
  }

  const created = await axios.post(
    `${getTelemedicineServiceUrl()}/api/sessions`,
    {
      appointmentId,
      doctorId,
      patientId,
      scheduledStartTime,
    },
    {
      timeout: 5000,
    }
  );

  return created?.data?.meetingUrl || "";
};

module.exports = {
  getVideoMeetingUrlForAppointment,
};