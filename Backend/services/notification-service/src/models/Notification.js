const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    error: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    notificationType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    recipient: {
      email: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        default: "",
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
    channelsAttempted: [
      {
        type: String,
        enum: ["email", "sms"],
      },
    ],
    status: {
      type: String,
      enum: ["sent", "partial", "failed"],
      required: true,
      index: true,
    },
    delivery: {
      type: [deliverySchema],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

notificationSchema.index({ "recipient.email": 1, createdAt: -1 });
notificationSchema.index({ "recipient.phone": 1, createdAt: -1 });
notificationSchema.index({ notificationType: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
