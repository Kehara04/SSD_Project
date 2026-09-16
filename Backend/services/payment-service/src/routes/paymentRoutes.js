const express = require("express");
const {
  initiatePayment,
  stripeWebhook,
  confirmPaymentByIntentId,
  getPaymentByAppointment,
  listMyPayments,
  listAllPaymentsAdmin,
} = require("../controllers/paymentController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Stripe webhook (no auth, raw body already set in app.js)
router.post("/webhook", stripeWebhook);

// Patient: initiate payment for an approved appointment
router.post("/initiate", authenticate, authorize("patient"), initiatePayment);

// Patient: poll payment status by Stripe paymentIntentId
router.get("/confirm/:paymentIntentId", authenticate, authorize("patient"), confirmPaymentByIntentId);

// Patient or Doctor: get payment record for a specific appointment
router.get(
  "/appointment/:appointmentId",
  authenticate,
  authorize("patient", "doctor"),
  getPaymentByAppointment
);

// Patient: list all my payments
router.get("/my", authenticate, authorize("patient"), listMyPayments);

// Admin: list all payment records
router.get("/admin/all", authenticate, authorize("admin"), listAllPaymentsAdmin);

module.exports = router;
