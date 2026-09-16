// const mongoose = require("mongoose");

// const appointmentSchema = new mongoose.Schema(
//   {
//     patientId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     doctorId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },

//     patientSnapshot: {
//       userId: Number,
//       name: String,
//       email: String,
//       phone: String,
//     },

//     doctorSnapshot: {
//       userId: Number,
//       name: String,
//       email: String,
//       phone: String,
//       specialization: String,
//       hospitalOrClinic: String,
//       consultationFee: Number,
//       inPersonConsultationFee: Number,
//       videoConsultationFee: Number,
//     },

//     specialty: {
//       type: String,
//       default: "",
//     },

//     appointmentDate: {
//       type: String,
//       required: true,
//     },

//     appointmentTime: {
//       type: String,
//       required: true,
//     },

//     reason: {
//       type: String,
//       default: "",
//     },

//     notes: {
//       type: String,
//       default: "",
//     },

//     consultationType: {
//       type: String,
//       enum: ["in_person", "video"],
//       default: "in_person",
//       index: true,
//     },

//     status: {
//       type: String,
//       enum: [
//         "pending",
//         "approved",
//         "rejected",
//         "cancelled",
//         "rescheduled",
//         "completed"
//       ],
//       default: "pending",
//       index: true,
//     },

//     doctorResponseNote: {
//       type: String,
//       default: "",
//     },

//     cancellationReason: {
//       type: String,
//       default: "",
//     },

//     rescheduleHistory: [
//       {
//         oldDate: String,
//         oldTime: String,
//         newDate: String,
//         newTime: String,
//         changedBy: {
//           type: String,
//           enum: ["patient", "doctor", "system"],
//           default: "patient",
//         },
//         changedAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Appointment", appointmentSchema);

const mongoose = require("mongoose");

const rescheduleHistorySchema = new mongoose.Schema(
  {
    oldDate: { type: String, default: "" },
    oldTime: { type: String, default: "" },
    oldLocationId: { type: String, default: "" },
    oldLocationName: { type: String, default: "" },
    newDate: { type: String, default: "" },
    newTime: { type: String, default: "" },
    newLocationId: { type: String, default: "" },
    newLocationName: { type: String, default: "" },
    changedBy: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    patientSnapshot: {
      userId: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    doctorSnapshot: {
      userId: { type: String, default: "" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      specialization: { type: String, default: "" },
      hospitalOrClinic: { type: String, default: "" },
      locationId: { type: String, default: "" },
      locationName: { type: String, default: "" },
      consultationFee: { type: Number, default: 0 },
      inPersonConsultationFee: { type: Number, default: 0 },
      videoConsultationFee: { type: Number, default: 0 },
    },

    practiceLocationSnapshot: {
      locationId: { type: String, default: "" },
      name: { type: String, default: "" },
      type: { type: String, default: "clinic" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      contactNumber: { type: String, default: "" },
    },

    specialty: {
      type: String,
      default: "",
    },

    appointmentDate: {
      type: String,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },

    consultationType: {
      type: String,
      enum: ["in_person", "video"],
      default: "in_person",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "completed",
        "rescheduled",
      ],
      default: "pending",
    },

    doctorResponseNote: {
      type: String,
      default: "",
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    rescheduleHistory: {
      type: [rescheduleHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);