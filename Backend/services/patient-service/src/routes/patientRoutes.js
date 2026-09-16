const express = require("express");
const {
  getMyPatientProfile,
  updateMyPatientProfile,
} = require("../controllers/patientController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authenticate, authorize("patient"), getMyPatientProfile);
router.put("/me", authenticate, authorize("patient"), updateMyPatientProfile);

module.exports = router;