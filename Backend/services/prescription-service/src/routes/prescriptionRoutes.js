const express = require("express");
const {
  createPrescriptionForAppointment,
  updatePrescriptionByDoctor,
  getPrescriptionByAppointmentForDoctor,
  getPrescriptionByAppointmentForPatient,
  listDoctorPrescriptions,
  listPatientPrescriptions,
  getDoctorPrescriptionById,
  getPatientPrescriptionById,
} = require("../controllers/prescriptionController");

const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/* Doctor routes */
router.post(
  "/doctor/appointment/:appointmentId",
  authenticate,
  authorize("doctor"),
  createPrescriptionForAppointment
);

router.put(
  "/doctor/:id",
  authenticate,
  authorize("doctor"),
  updatePrescriptionByDoctor
);

router.get(
  "/doctor/my",
  authenticate,
  authorize("doctor"),
  listDoctorPrescriptions
);

router.get(
  "/doctor/appointment/:appointmentId",
  authenticate,
  authorize("doctor"),
  getPrescriptionByAppointmentForDoctor
);

router.get(
  "/doctor/:id",
  authenticate,
  authorize("doctor"),
  getDoctorPrescriptionById
);

/* Patient routes */
router.get(
  "/patient/my",
  authenticate,
  authorize("patient"),
  listPatientPrescriptions
);

router.get(
  "/patient/appointment/:appointmentId",
  authenticate,
  authorize("patient"),
  getPrescriptionByAppointmentForPatient
);

router.get(
  "/patient/:id",
  authenticate,
  authorize("patient"),
  getPatientPrescriptionById
);

module.exports = router;