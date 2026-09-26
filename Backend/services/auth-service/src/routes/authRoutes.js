const express = require("express");
const {
  registerPatient,
  registerDoctor,
  registerAdmin,
  login,
  me,
} = require("../controllers/authController");
const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register/patient", registerPatient);
router.post("/register/doctor", registerDoctor);
// router.post("/register/admin", registerAdmin);

router.post(
  "/register/admin",
  authenticate,
  authorize("admin"),
  registerAdmin
);
router.post("/login", login);
router.get("/me", me);

module.exports = router;