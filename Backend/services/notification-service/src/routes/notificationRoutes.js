const express = require("express");
const {
  sendBookingNotification,
  sendCompletionNotification,
  sendPaymentNotification,
  sendWelcomeNotification,
  sendPrescriptionNotification,
  sendDoctorVerificationNotification,
  sendApprovedAppointmentNotificationByAppointmentId,
  listStoredNotifications,
  getStoredNotificationById,
  listEmailNotifications,
  getEmailNotificationById,
  listSmsNotifications,
  getSmsNotificationById,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", listStoredNotifications);
router.get("/emails", listEmailNotifications);
router.get("/emails/:id", getEmailNotificationById);
router.get("/sms", listSmsNotifications);
router.get("/sms/:id", getSmsNotificationById);
router.get("/:id", getStoredNotificationById);
router.post("/booking", sendBookingNotification);
router.post("/completion", sendCompletionNotification);
router.post("/payment", sendPaymentNotification);
router.post("/welcome", sendWelcomeNotification);
router.post("/prescription", sendPrescriptionNotification);
router.post("/doctor-verification", sendDoctorVerificationNotification);
router.post("/appointments/:appointmentId/approved", sendApprovedAppointmentNotificationByAppointmentId);

module.exports = router;
