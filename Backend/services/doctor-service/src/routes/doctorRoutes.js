const express = require("express");
const {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  listMyPracticeLocations,
  addPracticeLocation,
  updatePracticeLocation,
  deletePracticeLocation,
  updateDoctorAvailability,
  getAllApprovedDoctors,
  getDoctorById,
} = require("../controllers/doctorController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me/profile", authenticate, authorize("doctor"), getMyDoctorProfile);
router.put("/me/profile", authenticate, authorize("doctor"), updateMyDoctorProfile);

router.get("/me/locations", authenticate, authorize("doctor"), listMyPracticeLocations);
router.post("/me/locations", authenticate, authorize("doctor"), addPracticeLocation);
router.patch("/me/locations/:locationId", authenticate, authorize("doctor"), updatePracticeLocation);
router.delete("/me/locations/:locationId", authenticate, authorize("doctor"), deletePracticeLocation);

router.put("/me/availability", authenticate, authorize("doctor"), updateDoctorAvailability);

router.get("/", getAllApprovedDoctors);
router.get("/:id", getDoctorById);

module.exports = router;