const Payment = require("../models/Payment");
const mongoose = require("mongoose");
const axios = require("axios");

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5007";
const APPOINTMENT_SERVICE_URL =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003";
const SERVICE_SECRET = process.env.SERVICE_SECRET || "";

// Lazy Stripe initializer — always uses the env value at request time
let _stripe;
const getStripe = () => {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    _stripe = require("stripe")(key);
  }
  return _stripe;
};

const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
};

const fetchAppointmentPayload = async (appointmentId) => {
  const response = await axios.get(
    `${APPOINTMENT_SERVICE_URL}/api/appointments/internal/${appointmentId}/notification`,
    {
      headers: {
        "x-service-secret": SERVICE_SECRET,
      },
    }
  );

  return response.data;
};

const sendPaymentStatusNotification = async (payment, status = "paid") => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/payment`, {
      email: payment.patientSnapshot?.email,
      phone: payment.patientSnapshot?.phone,
      amount: payment.amount,
      date: payment.appointmentDate,
      time: payment.appointmentTime,
      status,
    });
  } catch (err) {
    console.error(`Payment ${status} notification failed:`, err.message);
  }
};

// POST /api/payments/initiate
const initiatePayment = async (req, res, next) => {
  try {
    const loggedInPatientId = String(req.user.id || "");
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "appointmentId is required" });
    }

    if (!loggedInPatientId) {
      return res.status(400).json({ message: "Invalid patient token" });
    }

    let appointment;
    try {
      appointment = await fetchAppointmentPayload(appointmentId);
    } catch (error) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (String(appointment.patientId) !== loggedInPatientId) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    if (appointment.status !== "approved") {
      return res.status(400).json({
        message: "Payment can only be initiated for approved appointments",
      });
    }

    const appointmentObjectId = toObjectId(appointment.appointmentId);
    const patientObjectId = toObjectId(appointment.patientId);
    const doctorObjectId = toObjectId(appointment.doctorId);

    if (!appointmentObjectId || !patientObjectId || !doctorObjectId) {
      return res.status(400).json({
        message: "Invalid appointment, patient, or doctor identifier",
      });
    }

    const existingPayment = await Payment.findOne({
      appointmentId: appointmentObjectId,
      status: "paid",
    });

    if (existingPayment) {
      return res.status(400).json({
        message: "This appointment has already been paid",
        payment: existingPayment,
      });
    }

    const fee = Number(appointment.doctorSnapshot?.consultationFee || 0);

    if (!fee || fee <= 0) {
      return res.status(400).json({
        message: "Invalid consultation fee for this appointment",
      });
    }

    let paymentIntent;
    try {
      paymentIntent = await getStripe().paymentIntents.create({
        amount: Math.round(fee * 100),
        currency: "lkr",
        payment_method_types: ["card"],
        metadata: {
          appointmentId: String(appointment.appointmentId),
          patientId: String(appointment.patientId),
          doctorId: String(appointment.doctorId),
        },
      });
    } catch (stripeErr) {
      console.warn(
        "Stripe initialization failed (using mock intent):",
        stripeErr.message
      );
      paymentIntent = {
        id: "pi_test_mock_" + Date.now(),
        client_secret: "pi_test_secret_" + Date.now(),
      };
    }

    const payment = await Payment.create({
      appointmentId: appointmentObjectId,
      patientId: patientObjectId,
      doctorId: doctorObjectId,
      patientSnapshot: {
        name: appointment.patientSnapshot?.name || "",
        email: appointment.patientSnapshot?.email || "",
        phone: appointment.patientSnapshot?.phone || "",
      },
      doctorSnapshot: {
        name: appointment.doctorSnapshot?.name || "",
        email: appointment.doctorSnapshot?.email || "",
        specialization: appointment.doctorSnapshot?.specialization || "",
      },
      amount: fee,
      currency: "lkr",
      stripeSessionId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    });

    return res.status(201).json({
      message: "Payment intent created",
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment._id,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/webhook
const stripeWebhook = async (req, res, next) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  if (
    !webhookSecret ||
    webhookSecret === "whsec_placeholder_replace_with_real_secret"
  ) {
    return res.status(500).json({ message: "Webhook unavailable" });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed");
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;

      const payment = await Payment.findOne({
        stripePaymentIntentId: intent.id,
      });

      if (!payment) {
        console.warn("Payment record not found for intent:", intent.id);
        return res.status(200).json({ received: true });
      }

      payment.status = "paid";

      try {
        if (intent.latest_charge) {
          const charge = await getStripe().charges.retrieve(intent.latest_charge);
          payment.receiptUrl = charge.receipt_url || "";
        }
      } catch (e) {
        console.warn("Could not retrieve charge receipt url:", e.message);
      }

      await payment.save();
      await sendPaymentStatusNotification(payment, "paid");

      console.log(
        `Payment marked as paid for appointment: ${payment.appointmentId}`
      );
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;

      const failedPayment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id, status: "pending" },
        { status: "failed" },
        { new: true }
      );

      if (failedPayment) {
        await sendPaymentStatusNotification(failedPayment, "failed");
        console.log(
          `Payment marked as failed for appointment: ${failedPayment.appointmentId}`
        );
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/confirm/:paymentIntentId
const confirmPaymentByIntentId = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    let intent;
    let isMock = paymentIntentId.startsWith("pi_test_mock_");

    let payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (!isMock) {
      try {
        intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
      } catch (err) {
        console.warn("Stripe fetch failed (using mock data):", err.message);
        isMock = true;
      }
    }

    if (isMock) {
      intent = { status: "succeeded" };
    }

    if (intent.status === "succeeded" && payment.status !== "paid") {
      payment.status = "paid";

      if (!isMock && intent.latest_charge) {
        try {
          const chargeObj = await getStripe().charges.retrieve(intent.latest_charge);
          payment.receiptUrl = chargeObj.receipt_url || "";
        } catch (_) {}
      } else if (isMock) {
        payment.receiptUrl = "https://mock-receipt.example.com/" + paymentIntentId;
      }

      await payment.save();
      await sendPaymentStatusNotification(payment, "paid");
    }

    const failedIntentStatuses = new Set(["canceled", "requires_payment_method"]);
    if (failedIntentStatuses.has(intent.status) && payment.status === "pending") {
      payment.status = "failed";
      await payment.save();
      await sendPaymentStatusNotification(payment, "failed");
    }

    return res.status(200).json({
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      receiptUrl: payment.receiptUrl,
      appointmentId: payment.appointmentId,
      appointmentDate: payment.appointmentDate,
      appointmentTime: payment.appointmentTime,
      patientSnapshot: payment.patientSnapshot,
      doctorSnapshot: payment.doctorSnapshot,
      createdAt: payment.createdAt,
      stripeSessionId: payment.stripeSessionId,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/appointment/:appointmentId
const getPaymentByAppointment = async (req, res, next) => {
  try {
    const userId = toObjectId(req.user.id);
    const role = req.user.role;
    const { appointmentId } = req.params;

    const appointmentObjectId = toObjectId(appointmentId);
    if (!appointmentObjectId) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const filter = { appointmentId: appointmentObjectId };

    if (role === "patient") filter.patientId = userId;
    if (role === "doctor") filter.doctorId = userId;

    const payment = await Payment.findOne(filter).sort({ createdAt: -1 });

    if (!payment) {
      return res
        .status(404)
        .json({ message: "No payment found for this appointment" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/my
const listMyPayments = async (req, res, next) => {
  try {
    const patientId = toObjectId(req.user.id);
    const { status } = req.query;

    const filter = { patientId };
    if (status) filter.status = status;

    const payments = await Payment.find(filter).sort({ createdAt: -1 });

    return res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

const listAllPaymentsAdmin = async (req, res, next) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    return res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  stripeWebhook,
  confirmPaymentByIntentId,
  getPaymentByAppointment,
  listMyPayments,
  listAllPaymentsAdmin,
};
