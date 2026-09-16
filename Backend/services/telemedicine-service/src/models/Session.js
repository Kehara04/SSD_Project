const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: true },
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },

    roomName: { type: String, required: true, unique: true },
    meetingUrl: { type: String, required: true },

    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },

    scheduledStartTime: Date,
    actualStartTime: Date,
    actualEndTime: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);