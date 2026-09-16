const express = require("express");
const {
  uploadMyReport,
  getMyReports,
  getMyReportById,
  openMyReport,
  deleteMyReport,
  getReportsByPatientIdForDoctor,
  getReportsByPatientNicForDoctor,
  getReportByIdForDoctor,
  openReportForDoctor,
  getAllReportsForAdmin,
} = require("../controllers/reportController");

const { authenticate, authorize } = require("../middleware/authMiddleware");
const { uploadReport } = require("../middleware/uploadMiddleware");

const router = express.Router();

/* Patient routes */
router.post(
  "/patient/my",
  authenticate,
  authorize("patient"),
  uploadReport.single("reportFile"),
  uploadMyReport
);

router.get(
  "/patient/my",
  authenticate,
  authorize("patient"),
  getMyReports
);

router.get(
  "/patient/my/:id",
  authenticate,
  authorize("patient"),
  getMyReportById
);

router.get(
  "/patient/my/:id/open",
  authenticate,
  authorize("patient"),
  openMyReport
);

router.delete(
  "/patient/my/:id",
  authenticate,
  authorize("patient"),
  deleteMyReport
);

/* Doctor routes */
router.get(
  "/doctor/patient/:patientId",
  authenticate,
  authorize("doctor"),
  getReportsByPatientIdForDoctor
);

router.get(
  "/doctor/patient/nic/:nic",
  authenticate,
  authorize("doctor"),
  getReportsByPatientNicForDoctor
);

router.get(
  "/doctor/:id",
  authenticate,
  authorize("doctor"),
  getReportByIdForDoctor
);

router.get(
  "/doctor/:id/open",
  authenticate,
  authorize("doctor"),
  openReportForDoctor
);

/* Admin routes */
router.get(
  "/admin/all",
  authenticate,
  authorize("admin"),
  getAllReportsForAdmin
);

module.exports = router;