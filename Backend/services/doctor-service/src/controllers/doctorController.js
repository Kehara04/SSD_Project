const { getInternalServiceHeaders } = require("../utils/internalServiceAuth");
const mongoose = require("mongoose");
const DoctorProfile = require("../models/DoctorProfile");
const getNextSequence = require("../utils/getNextSequence");

const AUTH_INTERNAL_SERVICE_URL =
  process.env.AUTH_INTERNAL_SERVICE_URL || "http://localhost:5011";

const fetchJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...getInternalServiceHeaders(),
      },
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data?.message || `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.statusCode = response.status;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
};

const getUserById = async (userId) => {
  return fetchJson(`${AUTH_INTERNAL_SERVICE_URL}/api/internal/users/${userId}`);
};

const updateUserBasic = async (userId, payload) => {
  return fetchJson(`${AUTH_INTERNAL_SERVICE_URL}/api/internal/users/${userId}/basic`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

const getApprovedDoctorsFromAuth = async () => {
  return fetchJson(`${AUTH_INTERNAL_SERVICE_URL}/api/internal/doctors/approved`);
};

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

const isValidTimeFormat = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(time || ""));

const ensureDoctorProfile = async (userId) => {
  let profile = await DoctorProfile.findOne({ userId });

  if (!profile) {
    const nextDoctorId = await getNextSequence("doctorId");
    profile = await DoctorProfile.create({
      userId,
      doctorId: nextDoctorId,
    });
  }

  if (!Array.isArray(profile.practiceLocations)) {
    profile.practiceLocations = [];
  }

  if (
    profile.hospitalOrClinic &&
    !profile.practiceLocations.some(
      (location) =>
        String(location.name || "").trim().toLowerCase() ===
        String(profile.hospitalOrClinic || "").trim().toLowerCase()
    )
  ) {
    profile.practiceLocations.push({
      name: profile.hospitalOrClinic,
      type: "clinic",
      isActive: true,
    });
    await profile.save();
  }

  return profile;
};

const buildProfileResponse = (profile) => {
  const activeLocations = (profile.practiceLocations || []).filter(
    (location) => location.isActive !== false
  );

  return {
    ...profile.toObject(),
    practiceLocations: profile.practiceLocations || [],
    activePracticeLocations: activeLocations,
  };
};

const normalizeConsultationModes = (value) => {
  if (!Array.isArray(value) || !value.length) {
    return ["in_person", "video"];
  }

  const normalized = value
    .map((item) => String(item).trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .map((item) => {
      if (["video", "telemedicine", "online"].includes(item)) return "video";
      if (["in_person", "inperson", "physical", "onsite"].includes(item)) return "in_person";
      return item;
    })
    .filter((item) => ["in_person", "video"].includes(item));

  return normalized.length ? Array.from(new Set(normalized)) : ["in_person", "video"];
};

const getMyDoctorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResponse = await getUserById(userId);
    const user = userResponse?.user || userResponse;

    if (!user || user.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    const profile = await ensureDoctorProfile(userId);

    return res.status(200).json({
      user: {
        id: user._id || user.id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorVerificationStatus: user.doctorVerificationStatus,
      },
      profile: buildProfileResponse(profile),
    });
  } catch (error) {
    next(error);
  }
};

const updateMyDoctorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResponse = await getUserById(userId);
    const user = userResponse?.user || userResponse;

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

    const basicUpdates = {};
    if (name !== undefined) basicUpdates.name = name;
    if (phone !== undefined) basicUpdates.phone = phone;

    let updatedUser = user;
    if (Object.keys(basicUpdates).length > 0) {
      const updateResponse = await updateUserBasic(userId, basicUpdates);
      updatedUser = updateResponse?.user || updateResponse;
    }

    const profile = await ensureDoctorProfile(userId);

    if (specialization !== undefined) profile.specialization = specialization;
    if (qualifications !== undefined) profile.qualifications = qualifications;
    if (hospitalOrClinic !== undefined) {
      profile.hospitalOrClinic = hospitalOrClinic;
    }
    if (consultationFee !== undefined) {
      profile.consultationFee = Number(consultationFee) || 0;
    }
    if (videoConsultationFee !== undefined) {
      profile.videoConsultationFee = Number(videoConsultationFee) || 0;
    }
    if (yearsOfExperience !== undefined) {
      profile.yearsOfExperience = Number(yearsOfExperience) || 0;
    }
    if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
    if (bio !== undefined) profile.bio = bio;

    await profile.save();

    return res.status(200).json({
      message: "Doctor profile updated successfully",
      user: {
        id: updatedUser._id || updatedUser.id,
        userId: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        doctorVerificationStatus: updatedUser.doctorVerificationStatus,
      },
      profile: buildProfileResponse(profile),
    });
  } catch (error) {
    next(error);
  }
};

const listMyPracticeLocations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await ensureDoctorProfile(userId);

    return res.status(200).json({
      doctorId: profile.doctorId,
      practiceLocations: profile.practiceLocations || [],
    });
  } catch (error) {
    next(error);
  }
};

const addPracticeLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, type, address, city, contactNumber, isActive } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Location name is required" });
    }

    const profile = await ensureDoctorProfile(userId);

    profile.practiceLocations.push({
      name: String(name).trim(),
      type: ["hospital", "clinic", "center", "other"].includes(type) ? type : "clinic",
      address: address !== undefined ? String(address).trim() : "",
      city: city !== undefined ? String(city).trim() : "",
      contactNumber: contactNumber !== undefined ? String(contactNumber).trim() : "",
      isActive: isActive !== false,
    });

    await profile.save();
    const createdLocation = profile.practiceLocations[profile.practiceLocations.length - 1];

    return res.status(201).json({
      message: "Practice location added successfully",
      doctorId: profile.doctorId,
      practiceLocation: createdLocation,
      practiceLocations: profile.practiceLocations,
    });
  } catch (error) {
    next(error);
  }
};

const updatePracticeLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { locationId } = req.params;
    const profile = await ensureDoctorProfile(userId);

    const location = profile.practiceLocations.id(locationId);
    if (!location) {
      return res.status(404).json({ message: "Practice location not found" });
    }

    const { name, type, address, city, contactNumber, isActive } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ message: "Location name cannot be empty" });
      }
      location.name = String(name).trim();
    }

    if (type !== undefined && ["hospital", "clinic", "center", "other"].includes(type)) {
      location.type = type;
    }
    if (address !== undefined) location.address = String(address).trim();
    if (city !== undefined) location.city = String(city).trim();
    if (contactNumber !== undefined) location.contactNumber = String(contactNumber).trim();
    if (isActive !== undefined) location.isActive = Boolean(isActive);

    profile.availability = (profile.availability || []).map((slot) => {
      if (String(slot.locationId || "") === String(location._id)) {
        slot.locationName = location.name;
      }
      return slot;
    });

    await profile.save();

    return res.status(200).json({
      message: "Practice location updated successfully",
      doctorId: profile.doctorId,
      practiceLocation: location,
      practiceLocations: profile.practiceLocations,
    });
  } catch (error) {
    next(error);
  }
};

const deletePracticeLocation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { locationId } = req.params;
    const profile = await ensureDoctorProfile(userId);

    const location = profile.practiceLocations.id(locationId);
    if (!location) {
      return res.status(404).json({ message: "Practice location not found" });
    }

    const hasAvailability = (profile.availability || []).some(
      (slot) => String(slot.locationId || "") === String(locationId)
    );

    if (hasAvailability) {
      return res.status(400).json({
        message: "Cannot delete a location that is used by availability slots. Remove those availability slots first.",
      });
    }

    location.deleteOne();
    await profile.save();

    return res.status(200).json({
      message: "Practice location deleted successfully",
      doctorId: profile.doctorId,
      practiceLocations: profile.practiceLocations,
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

    const profile = await ensureDoctorProfile(userId);

    const cleanedAvailability = [];

    for (const slot of availability) {
      if (!slot?.day || !slot?.startTime || !slot?.endTime) {
        continue;
      }

      const normalizedDay = normalizeDay(slot.day);
      const startTime = String(slot.startTime).trim();
      const endTime = String(slot.endTime).trim();

      if (!normalizedDay || !isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
        continue;
      }

      let locationId = slot.locationId;
      let locationName = String(slot.locationName || "").trim();
      let locationDoc = null;

      if (locationId && mongoose.Types.ObjectId.isValid(String(locationId))) {
        locationDoc = profile.practiceLocations.id(String(locationId));
      }

      if (!locationDoc && locationName) {
        locationDoc = (profile.practiceLocations || []).find(
          (item) => String(item.name || "").trim().toLowerCase() === locationName.toLowerCase()
        );
      }

      if (!locationDoc && profile.practiceLocations.length === 1) {
        locationDoc = profile.practiceLocations[0];
      }

      if (!locationDoc && locationName) {
        profile.practiceLocations.push({
          name: locationName,
          type: "clinic",
          isActive: true,
        });
        locationDoc = profile.practiceLocations[profile.practiceLocations.length - 1];
      }

      if (locationDoc) {
        locationId = locationDoc._id;
        locationName = locationDoc.name;
      } else {
        locationId = undefined;
        locationName = locationName || String(profile.hospitalOrClinic || "").trim();
      }

      cleanedAvailability.push({
        locationId,
        locationName,
        day: normalizedDay,
        startTime,
        endTime,
        slotDuration: Number(slot.slotDuration) > 0 ? Number(slot.slotDuration) : 15,
        consultationFee:
          slot.consultationFee !== undefined ? Number(slot.consultationFee) || 0 : Number(profile.consultationFee || 0),
        videoConsultationFee:
          slot.videoConsultationFee !== undefined
            ? Number(slot.videoConsultationFee) || 0
            : Number(profile.videoConsultationFee || 0),
        consultationModes: normalizeConsultationModes(slot.consultationModes),
        isAvailable: slot.isAvailable !== false,
      });
    }

    profile.availability = cleanedAvailability;
    await profile.save();

    return res.status(200).json({
      message: "Doctor availability updated successfully",
      doctorId: profile.doctorId,
      availability: profile.availability,
      practiceLocations: profile.practiceLocations,
    });
  } catch (error) {
    next(error);
  }
};

const getAllApprovedDoctors = async (req, res, next) => {
  try {
    const authResponse = await getApprovedDoctorsFromAuth();
    const approvedDoctors = Array.isArray(authResponse?.doctors)
      ? authResponse.doctors
      : Array.isArray(authResponse)
      ? authResponse
      : [];

    const doctorIds = approvedDoctors.map((doctor) =>
      (doctor._id || doctor.id).toString()
    );

    const profiles = await DoctorProfile.find({ userId: { $in: doctorIds } });

    const profileMap = new Map();
    profiles.forEach((profile) => {
      profileMap.set(profile.userId.toString(), buildProfileResponse(profile));
    });

    const result = approvedDoctors.map((doctor) => ({
      id: doctor._id || doctor.id,
      userId: doctor.userId,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      doctorVerificationStatus: doctor.doctorVerificationStatus,
      profile: profileMap.get((doctor._id || doctor.id).toString()) || null,
    }));

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userResponse = await getUserById(id);
    const doctor = userResponse?.user || userResponse;

    if (
      !doctor ||
      doctor.role !== "doctor" ||
      doctor.isActive === false ||
      doctor.doctorVerificationStatus !== "approved"
    ) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const profile = await DoctorProfile.findOne({
      userId: (doctor._id || doctor.id).toString(),
    });

    return res.status(200).json({
      id: doctor._id || doctor.id,
      userId: doctor.userId,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      doctorVerificationStatus: doctor.doctorVerificationStatus,
      profile: profile ? buildProfileResponse(profile) : null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  listMyPracticeLocations,
  addPracticeLocation,
  updatePracticeLocation,
  deletePracticeLocation,
  updateDoctorAvailability,
  getAllApprovedDoctors,
  getDoctorById,
};
