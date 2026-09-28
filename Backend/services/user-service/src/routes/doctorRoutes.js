const express = require("express");
const {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  updateDoctorAvailability,
  getAllApprovedDoctors,
  getDoctorById,
} = require("../controllers/doctorController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me/profile", authenticate, authorize("doctor"), getMyDoctorProfile);
router.put("/me/profile", authenticate, authorize("doctor"), updateMyDoctorProfile);
router.put("/me/availability", authenticate, authorize("doctor"), updateDoctorAvailability);

router.get("/", getAllApprovedDoctors);
router.get("/:id", getDoctorById);

module.exports = router;