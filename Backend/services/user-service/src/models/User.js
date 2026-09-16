const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
      index: true,
    },
    name: String,
    nic: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    email: String,
    password: {
      type: String,
      select: false,
    },
    phone: String,
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    doctorVerificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_applicable"],
      default: "not_applicable",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);