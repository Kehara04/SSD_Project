const { getInternalServiceHeaders } = require("../utils/internalServiceAuth");
const PatientProfile = require("../models/PatientProfile");
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

const checkNicAvailability = async (nic, excludeId) => {
  const query = new URLSearchParams();
  if (excludeId) query.append("excludeId", excludeId);

  return fetchJson(
    `${AUTH_INTERNAL_SERVICE_URL}/api/internal/users/check-nic/${encodeURIComponent(
      nic
    )}?${query.toString()}`
  );
};

const getMyPatientProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const userResponse = await getUserById(userId);
    const user = userResponse?.user || userResponse;

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
        id: user._id || user.id,
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

    const userResponse = await getUserById(userId);
    const user = userResponse?.user || userResponse;

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

    const basicUpdates = {};

    if (name !== undefined) basicUpdates.name = name;
    if (phone !== undefined) basicUpdates.phone = phone;

    if (nic !== undefined) {
      const normalizedNic = nic.trim().toUpperCase();

      const nicCheckResponse = await checkNicAvailability(
        normalizedNic,
        userId.toString()
      );

      if (nicCheckResponse?.exists) {
        return res.status(409).json({ message: "NIC already in use" });
      }

      basicUpdates.nic = normalizedNic;
    }

    let updatedUser = user;

    if (Object.keys(basicUpdates).length > 0) {
      const updateResponse = await updateUserBasic(userId, basicUpdates);
      updatedUser = updateResponse?.user || updateResponse;
    }

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
    if (medicalHistorySummary !== undefined) {
      profile.medicalHistorySummary = medicalHistorySummary;
    }
    if (emergencyContactName !== undefined) {
      profile.emergencyContactName = emergencyContactName;
    }
    if (emergencyContactPhone !== undefined) {
      profile.emergencyContactPhone = emergencyContactPhone;
    }

    await profile.save();

    return res.status(200).json({
      message: "Patient profile updated successfully",
      user: {
        id: updatedUser._id || updatedUser.id,
        userId: updatedUser.userId,
        name: updatedUser.name,
        nic: updatedUser.nic || "",
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
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