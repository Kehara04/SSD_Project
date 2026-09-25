const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    nic: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Local accounts require a password.
    // Google-only patients do not have a local password.
    password: {
      type: String,

      required: function () {
        return !this.googleSub;
      },

      minlength: 6,
      select: false,
    },

    // Stable Google identity identifier.
    googleSub: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    role: {
      type: String,
      enum: [
        "patient",
        "doctor",
        "admin",
      ],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    doctorVerificationStatus: {
      type: String,

      enum: [
        "pending",
        "approved",
        "rejected",
        "not_applicable",
      ],

      default: function () {
        return this.role === "doctor"
          ? "pending"
          : "not_applicable";
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "User",
  userSchema
);
