const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const getNextSequence = require("../utils/getNextSequence");

const getMyPatientProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.role !== "patient") {
      return res.status(404).json({ message: "Patient user not found" });
    }

    let profile = await PatientProfile.findOne({ userId });

    if (!profile) {
      const nextPatientId = await getNextSequence("patientId");
      profile = await PatientProfile.create({
        userId,
        patientId: nextPatientId,
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        nic: user.nic || "",
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyPatientProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.role !== "patient") {
      return res.status(404).json({ message: "Patient user not found" });
    }

    const {
      name,
      nic,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodGroup,
      allergies,
      medicalHistorySummary,
      emergencyContactName,
      emergencyContactPhone,
    } = req.body;

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (nic !== undefined) {
      const normalizedNic = nic.trim().toUpperCase();

      const existingNicUser = await User.findOne({
        nic: normalizedNic,
        _id: { $ne: userId },
      });

      if (existingNicUser) {
        return res.status(409).json({ message: "NIC already in use" });
      }

      user.nic = normalizedNic;
    }

    await user.save();

    let profile = await PatientProfile.findOne({ userId });

    if (!profile) {
      const nextPatientId = await getNextSequence("patientId");
      profile = new PatientProfile({
        userId,
        patientId: nextPatientId,
      });
    }

    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    if (gender !== undefined) profile.gender = gender;
    if (address !== undefined) profile.address = address;
    if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup;
    if (allergies !== undefined) profile.allergies = allergies;
    if (medicalHistorySummary !== undefined) profile.medicalHistorySummary = medicalHistorySummary;
    if (emergencyContactName !== undefined) profile.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) profile.emergencyContactPhone = emergencyContactPhone;

    await profile.save();

    return res.status(200).json({
      message: "Patient profile updated successfully",
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        nic: user.nic || "",
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPatientProfile,
  updateMyPatientProfile,
};