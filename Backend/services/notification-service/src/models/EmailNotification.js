const mongoose = require("mongoose");

const emailNotificationSchema = new mongoose.Schema(
  {
    parentNotification: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      index: true,
    },
    notificationType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recipient: {
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      role: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
      userId: {
        type: Number,
        index: true,
      },
    },
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
  
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
      index: true,
    },
    error: {
      type: String,
      default: "",
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

emailNotificationSchema.index({ "recipient.email": 1, createdAt: -1 });
emailNotificationSchema.index({ notificationType: 1, createdAt: -1 });

module.exports = mongoose.model("EmailNotification", emailNotificationSchema);
