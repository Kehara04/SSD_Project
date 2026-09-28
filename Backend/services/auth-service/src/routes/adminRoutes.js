const express = require("express");
const {
  getAllUsers,
  getPendingDoctors,
  verifyDoctor,
  deactivateUser,
  activateUser,
} = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", authenticate, authorize("admin"), getAllUsers);
router.get("/doctors/pending", authenticate, authorize("admin"), getPendingDoctors);
router.patch("/doctors/:id/verify", authenticate, authorize("admin"), verifyDoctor);
router.patch("/users/:id/deactivate", authenticate, authorize("admin"), deactivateUser);
router.patch("/users/:id/activate", authenticate, authorize("admin"), activateUser);

module.exports = router;