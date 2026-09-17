const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const {
  createSession,
  getSessionByAppointment,
  joinSession,
  endSession,
} = require("../controllers/sessionController");

const router = express.Router();

router.use(authenticate);

router.post("/", createSession);
router.get("/appointment/:appointmentId", getSessionByAppointment);
router.put("/:id/join", joinSession);
router.put("/:id/end", endSession);

module.exports = router;
