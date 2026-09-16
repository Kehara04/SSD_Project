const mongoose = require("mongoose");

const medicalReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: Number,
      unique: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "general",
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      index: true,
    },
    cloudinaryAssetId: {
      type: String,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinarySecureUrl: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalReport", medicalReportSchema);