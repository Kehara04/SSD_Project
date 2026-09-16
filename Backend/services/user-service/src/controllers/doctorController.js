// const User = require("../models/User");
// const DoctorProfile = require("../models/DoctorProfile");
// const getNextSequence = require("../utils/getNextSequence");

// const getMyDoctorProfile = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     const user = await User.findById(userId);
//     if (!user || user.role !== "doctor") {
//       return res.status(404).json({ message: "Doctor user not found" });
//     }

//     let profile = await DoctorProfile.findOne({ userId });

//     if (!profile) {
//       const nextDoctorId = await getNextSequence("doctorId");
//       profile = await DoctorProfile.create({
//         userId,
//         doctorId: nextDoctorId,
//       });
//     }

//     return res.status(200).json({
//       user: {
//         id: user._id,
//         userId: user.userId,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         doctorVerificationStatus: user.doctorVerificationStatus,
//       },
//       profile,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const updateMyDoctorProfile = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     const user = await User.findById(userId);
//     if (!user || user.role !== "doctor") {
//       return res.status(404).json({ message: "Doctor user not found" });
//     }

//     const {
//       name,
//       phone,
//       specialization,
//       qualifications,
//       hospitalOrClinic,
//       consultationFee,
//       yearsOfExperience,
//       licenseNumber,
//       bio,
//     } = req.body;

//     if (name !== undefined) user.name = name;
//     if (phone !== undefined) user.phone = phone;

//     await user.save();

//     let profile = await DoctorProfile.findOne({ userId });

//     if (!profile) {
//       const nextDoctorId = await getNextSequence("doctorId");
//       profile = new DoctorProfile({
//         userId,
//         doctorId: nextDoctorId,
//       });
//     }

//     if (specialization !== undefined) profile.specialization = specialization;
//     if (qualifications !== undefined) profile.qualifications = qualifications;
//     if (hospitalOrClinic !== undefined) profile.hospitalOrClinic = hospitalOrClinic;
//     if (consultationFee !== undefined) profile.consultationFee = consultationFee;
//     if (yearsOfExperience !== undefined) profile.yearsOfExperience = yearsOfExperience;
//     if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
//     if (bio !== undefined) profile.bio = bio;

//     await profile.save();

//     return res.status(200).json({
//       message: "Doctor profile updated successfully",
//       user: {
//         id: user._id,
//         userId: user.userId,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         doctorVerificationStatus: user.doctorVerificationStatus,
//       },
//       profile,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const updateDoctorAvailability = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const { availability } = req.body;

//     if (!Array.isArray(availability)) {
//       return res.status(400).json({ message: "Availability must be an array" });
//     }

//     let profile = await DoctorProfile.findOne({ userId });

//     if (!profile) {
//       const nextDoctorId = await getNextSequence("doctorId");
//       profile = new DoctorProfile({
//         userId,
//         doctorId: nextDoctorId,
//       });
//     }

//     profile.availability = availability;
//     await profile.save();

//     return res.status(200).json({
//       message: "Doctor availability updated successfully",
//       doctorId: profile.doctorId,
//       availability: profile.availability,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getAllApprovedDoctors = async (req, res, next) => {
//   try {
//     const approvedDoctors = await User.find({
//       role: "doctor",
//       isActive: true,
//       doctorVerificationStatus: "approved",
//     });

//     const doctorIds = approvedDoctors.map((doctor) => doctor._id);
//     const profiles = await DoctorProfile.find({ userId: { $in: doctorIds } });

//     const profileMap = new Map();
//     profiles.forEach((profile) => {
//       profileMap.set(profile.userId.toString(), profile);
//     });

//     const result = approvedDoctors.map((doctor) => ({
//       id: doctor._id,
//       userId: doctor.userId,
//       name: doctor.name,
//       email: doctor.email,
//       phone: doctor.phone,
//       doctorVerificationStatus: doctor.doctorVerificationStatus,
//       profile: profileMap.get(doctor._id.toString()) || null,
//     }));

//     return res.status(200).json(result);
//   } catch (error) {
//     next(error);
//   }
// };

// const getDoctorById = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const doctor = await User.findOne({
//       _id: id,
//       role: "doctor",
//       isActive: true,
//       doctorVerificationStatus: "approved",
//     });

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     const profile = await DoctorProfile.findOne({ userId: doctor._id });

//     return res.status(200).json({
//       id: doctor._id,
//       userId: doctor.userId,
//       name: doctor.name,
//       email: doctor.email,
//       phone: doctor.phone,
//       doctorVerificationStatus: doctor.doctorVerificationStatus,
//       profile,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   getMyDoctorProfile,
//   updateMyDoctorProfile,
//   updateDoctorAvailability,
//   getAllApprovedDoctors,
//   getDoctorById,
// };

const User = require("../models/User");
const DoctorProfile = require("../models/DoctorProfile");
const getNextSequence = require("../utils/getNextSequence");

const normalizeDay = (value) => {
  if (!value) return "";

  const normalized = String(value).trim().toLowerCase();

  const aliases = {
    sun: "Sunday",
    sunday: "Sunday",
    mon: "Monday",
    monday: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    tuesday: "Tuesday",
    wed: "Wednesday",
    wednesday: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    thursday: "Thursday",
    fri: "Friday",
    friday: "Friday",
    sat: "Saturday",
    saturday: "Saturday",
  };

  return aliases[normalized] || "";
};

const getMyDoctorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    let profile = await DoctorProfile.findOne({ userId });

    if (!profile) {
      const nextDoctorId = await getNextSequence("doctorId");
      profile = await DoctorProfile.create({
        userId,
        doctorId: nextDoctorId,
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorVerificationStatus: user.doctorVerificationStatus,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyDoctorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    const {
      name,
      phone,
      specialization,
      qualifications,
      hospitalOrClinic,
      consultationFee,
      videoConsultationFee,
      yearsOfExperience,
      licenseNumber,
      bio,
    } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    let profile = await DoctorProfile.findOne({ userId });

    if (!profile) {
      const nextDoctorId = await getNextSequence("doctorId");
      profile = new DoctorProfile({
        userId,
        doctorId: nextDoctorId,
      });
    }

    if (specialization !== undefined) profile.specialization = specialization;
    if (qualifications !== undefined) profile.qualifications = qualifications;
    if (hospitalOrClinic !== undefined) profile.hospitalOrClinic = hospitalOrClinic;
    if (consultationFee !== undefined) profile.consultationFee = consultationFee;
    if (videoConsultationFee !== undefined) profile.videoConsultationFee = videoConsultationFee;
    if (yearsOfExperience !== undefined) profile.yearsOfExperience = yearsOfExperience;
    if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
    if (bio !== undefined) profile.bio = bio;

    await profile.save();

    return res.status(200).json({
      message: "Doctor profile updated successfully",
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorVerificationStatus: user.doctorVerificationStatus,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateDoctorAvailability = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: "Availability must be an array" });
    }

    const cleanedAvailability = availability
      .filter((slot) => slot.day && slot.startTime && slot.endTime)
      .map((slot) => ({
        day: normalizeDay(slot.day),
        startTime: String(slot.startTime).trim(),
        endTime: String(slot.endTime).trim(),
        isAvailable: slot.isAvailable !== false,
      }))
      .filter((slot) => slot.day);

    let profile = await DoctorProfile.findOne({ userId });

    if (!profile) {
      const nextDoctorId = await getNextSequence("doctorId");
      profile = new DoctorProfile({
        userId,
        doctorId: nextDoctorId,
      });
    }

    profile.availability = cleanedAvailability;
    await profile.save();

    return res.status(200).json({
      message: "Doctor availability updated successfully",
      doctorId: profile.doctorId,
      availability: profile.availability,
    });
  } catch (error) {
    next(error);
  }
};

const getAllApprovedDoctors = async (req, res, next) => {
  try {
    const approvedDoctors = await User.find({
      role: "doctor",
      isActive: true,
      doctorVerificationStatus: "approved",
    });

    const doctorIds = approvedDoctors.map((doctor) => doctor._id);
    const profiles = await DoctorProfile.find({ userId: { $in: doctorIds } });

    const profileMap = new Map();
    profiles.forEach((profile) => {
      profileMap.set(profile.userId.toString(), profile);
    });

    const result = approvedDoctors.map((doctor) => ({
      id: doctor._id,
      userId: doctor.userId,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      doctorVerificationStatus: doctor.doctorVerificationStatus,
      profile: profileMap.get(doctor._id.toString()) || null,
    }));

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await User.findOne({
      _id: id,
      role: "doctor",
      isActive: true,
      doctorVerificationStatus: "approved",
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const profile = await DoctorProfile.findOne({ userId: doctor._id });

    return res.status(200).json({
      id: doctor._id,
      userId: doctor.userId,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      doctorVerificationStatus: doctor.doctorVerificationStatus,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  updateDoctorAvailability,
  getAllApprovedDoctors,
  getDoctorById,
};
