const express = require("express");
const {
  searchDoctorsForBooking,
  getDoctorAvailableSlots,
  createAppointment,
  listPatientAppointments,
  listDoctorAppointments,
  listAllAppointmentsAdmin,
  respondToAppointment,
  cancelAppointment,
  rescheduleAppointment,
  trackAppointmentStatus,
  getAppointmentById,
  getAppointmentNotificationPayload,
} = require("../controllers/appointmentController");

const { authenticate, authorize } = require("../middleware/authMiddleware");
const { authenticateService } = require("../middleware/serviceAuth");

const router = express.Router();

router.get("/doctors/search", searchDoctorsForBooking);
router.get("/doctors/:doctorId/slots", getDoctorAvailableSlots);

router.get(
  "/internal/:id/notification",
  authenticateService,
  getAppointmentNotificationPayload
);

router.post("/", authenticate, authorize("patient"), createAppointment);
router.get("/patient/my", authenticate, authorize("patient"), listPatientAppointments);
router.patch("/:id/cancel", authenticate, authorize("patient", "doctor"), cancelAppointment);
router.patch("/:id/reschedule", authenticate, authorize("patient"), rescheduleAppointment);

router.get("/doctor/my", authenticate, authorize("doctor"), listDoctorAppointments);
router.patch("/:id/respond", authenticate, authorize("doctor"), respondToAppointment);

router.get("/:id/status", authenticate, authorize("patient", "doctor"), trackAppointmentStatus);
router.get("/:id", authenticate, authorize("patient", "doctor"), getAppointmentById);

router.get("/admin/all", authenticate, authorize("admin"), listAllAppointmentsAdmin);

module.exports = router;
