const express = require("express");
const {
  registerPatient,
  registerDoctor,
  registerAdmin,
  login,
  me,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register/patient", registerPatient);
router.post("/register/doctor", registerDoctor);
router.post("/register/admin", registerAdmin);
router.post("/login", login);
router.get("/me", me);

module.exports = router;