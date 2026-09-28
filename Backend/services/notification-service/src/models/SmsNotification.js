const mongoose = require("mongoose");

const smsNotificationSchema = new mongoose.Schema(
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
      phone: {
        type: String,
        required: true,
        trim: true,
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

smsNotificationSchema.index({ "recipient.phone": 1, createdAt: -1 });
smsNotificationSchema.index({ notificationType: 1, createdAt: -1 });

module.exports = mongoose.model("SmsNotification", smsNotificationSchema);
