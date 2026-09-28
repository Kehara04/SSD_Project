const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      default: "",
      trim: true,
    },
    frequency: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: String,
      default: "",
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: Number,
      unique: true,
      index: true,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    patientSnapshot: {
      userId: Number,
      name: String,
      email: String,
      phone: String,
    },

    doctorSnapshot: {
      userId: Number,
      name: String,
      email: String,
      phone: String,
      specialization: String,
      hospitalOrClinic: String,
    },

    appointmentSnapshot: {
      appointmentDate: String,
      appointmentTime: String,
      consultationType: String,
      specialty: String,
      reason: String,
      status: String,
    },

    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },

    symptoms: {
      type: String,
      default: "",
      trim: true,
    },

    medicines: {
      type: [medicineSchema],
      default: [],
    },

    advice: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    followUpDate: {
      type: String,
      default: "",
      trim: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);