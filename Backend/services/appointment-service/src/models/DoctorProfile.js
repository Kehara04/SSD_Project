// const mongoose = require("mongoose");

// const availabilitySchema = new mongoose.Schema(
//   {
//     day: {
//       type: String,
//       required: true,
//     },
//     startTime: {
//       type: String,
//       required: true,
//     },
//     endTime: {
//       type: String,
//       required: true,
//     },
//     isAvailable: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { _id: false }
// );

// const doctorProfileSchema = new mongoose.Schema(
//   {
//     doctorId: {
//       type: Number,
//       unique: true,
//       index: true,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true,
//     },
//     specialization: {
//       type: String,
//       default: "",
//     },
//     qualifications: {
//       type: String,
//       default: "",
//     },
//     hospitalOrClinic: {
//       type: String,
//       default: "",
//     },
//     consultationFee: {
//       type: Number,
//       default: 0,
//     },
//     videoConsultationFee: {
//       type: Number,
//       default: 0,
//     },
//     yearsOfExperience: {
//       type: Number,
//       default: 0,
//     },
//     licenseNumber: {
//       type: String,
//       default: "",
//     },
//     bio: {
//       type: String,
//       default: "",
//     },
//     availability: {
//       type: [availabilitySchema],
//       default: [],
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);

const mongoose = require("mongoose");

const practiceLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["hospital", "clinic", "center", "other"],
      default: "clinic",
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    contactNumber: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const availabilitySchema = new mongoose.Schema(
  {
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    locationName: {
      type: String,
      default: "",
      trim: true,
    },
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
    slotDuration: {
      type: Number,
      default: 15,
      min: 5,
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    videoConsultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    consultationModes: {
      type: [String],
      default: ["in_person", "video"],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
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
    practiceLocations: {
      type: [practiceLocationSchema],
      default: [],
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
