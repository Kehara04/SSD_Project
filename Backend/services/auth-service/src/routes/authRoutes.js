// const express = require("express");
// const {
//   registerPatient,
//   registerDoctor,
//   registerAdmin,
//   login,
//   me,
// } = require("../controllers/authController");

// const router = express.Router();

// router.post("/register/patient", registerPatient);
// router.post("/register/doctor", registerDoctor);
// router.post("/register/admin", registerAdmin);
// router.post("/login", login);
// router.get("/me", me);

// module.exports = router;


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

/* =========================================================
   PUBLIC REGISTRATION ROUTES
========================================================= */

router.post(
  "/register/patient",
  registerPatient
);

router.post(
  "/register/doctor",
  registerDoctor
);

/* =========================================================
   ADMIN REGISTRATION
   SECURITY FIX:
   Only an authenticated admin can create another admin.
========================================================= */

router.post(
  "/register/admin",
  authenticate,
  authorize("admin"),
  registerAdmin
);

/* =========================================================
   LOGIN
========================================================= */

router.post(
  "/login",
  login
);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",
  me
);

module.exports = router;