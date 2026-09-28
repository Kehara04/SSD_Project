const axios = require("axios");

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5007";

const cleanString = (value) => String(value ?? "").trim();

const sendPrescriptionNotification = async ({ prescription }) => {
  if (!prescription) return;

  const patientEmail = cleanString(prescription.patientSnapshot?.email);
  if (!patientEmail) {
    console.warn("Prescription notification skipped: patient email is missing");
    return;
  }

  const payload = {
    email: patientEmail,
    patientName: cleanString(prescription.patientSnapshot?.name),
    doctorName: cleanString(prescription.doctorSnapshot?.name),
    appointmentDate: cleanString(prescription.appointmentSnapshot?.appointmentDate),
    appointmentTime: cleanString(prescription.appointmentSnapshot?.appointmentTime),
    diagnosis: cleanString(prescription.diagnosis),
    symptoms: cleanString(prescription.symptoms),
    advice: cleanString(prescription.advice),
    notes: cleanString(prescription.notes),
    followUpDate: cleanString(prescription.followUpDate),
    medicines: Array.isArray(prescription.medicines) ? prescription.medicines : [],
    prescriptionId:
      prescription.prescriptionId !== undefined && prescription.prescriptionId !== null
        ? String(prescription.prescriptionId)
        : "",
    issuedAt: prescription.issuedAt || prescription.createdAt || "",
  };

  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/prescription`,
      payload
    );
  } catch (error) {
    const reason = error.response?.data?.message || error.message;
    console.error(`Prescription notification failed: ${reason}`);
  }
};

module.exports = {
  sendPrescriptionNotification,
};
