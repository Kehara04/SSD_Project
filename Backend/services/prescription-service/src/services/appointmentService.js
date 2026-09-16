const axios = require("axios");

const getAppointmentById = async (appointmentId, authHeader) => {
  const baseURL = process.env.APPOINTMENT_SERVICE_URL;

  if (!baseURL) {
    throw new Error("APPOINTMENT_SERVICE_URL is not configured");
  }

  const response = await axios.get(
    `${baseURL}/api/appointments/${appointmentId}`,
    {
      headers: {
        Authorization: authHeader,
      },
    }
  );

  return response.data;
};

module.exports = {
  getAppointmentById,
};