const mongoose = require("mongoose");

const patientProfileSchema = new mongoose.Schema(
  {
    patientId: {
      type: Number,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    bloodGroup: {
      type: String,
      default: "",
    },
    allergies: {
      type: [String],
      default: [],
    },
    medicalHistorySummary: {
      type: String,
      default: "",
    },
    emergencyContactName: {
      type: String,
      default: "",
    },
    emergencyContactPhone: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientProfile", patientProfileSchema);