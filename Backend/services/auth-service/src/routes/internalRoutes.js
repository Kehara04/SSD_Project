const express = require("express");
const { authenticateService } = require("../middleware/serviceAuth");
const {
  getUserByIdInternal,
  updateUserBasicInternal,
  checkNicAvailabilityInternal,
  getUserByNicInternal,
  getApprovedDoctorsInternal,
} = require("../controllers/internalController");

const router = express.Router();
router.use(authenticateService);

router.get("/users/:id", getUserByIdInternal);
router.patch("/users/:id/basic", updateUserBasicInternal);
router.get("/users/check-nic/:nic", checkNicAvailabilityInternal);
router.get("/users/by-nic/:nic", getUserByNicInternal);
router.get("/doctors/approved", getApprovedDoctorsInternal);

module.exports = router;
