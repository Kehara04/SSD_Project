const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    doctorId: {
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
    specialization: {
      type: String,
      default: "",
    },
    qualifications: {
      type: String,
      default: "",
    },
    hospitalOrClinic: {
      type: String,
      default: "",
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    videoConsultationFee: {
      type: Number,
      default: 0,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
    },
    licenseNumber: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
