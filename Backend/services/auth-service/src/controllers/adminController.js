const User = require("../models/User");

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5007";

const DOCTOR_SERVICE_URL =
  process.env.DOCTOR_SERVICE_URL || "http://localhost:5000";

const fetchJson = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
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

const sendDoctorVerificationNotification = async ({ email, name, status }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/doctor-verification`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, status }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message || "";
      } catch {
        errorMessage = "";
      }

      console.error(
        `Doctor verification notification failed (${response.status})${
          errorMessage ? `: ${errorMessage}` : ""
        }`
      );
    }
  } catch (error) {
    const reason =
      error.name === "AbortError" ? "request timeout after 5s" : error.message;
    console.error(`Doctor verification notification failed: ${reason}`);
  } finally {
    clearTimeout(timeout);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({
      role: "doctor",
      doctorVerificationStatus: "pending",
    }).sort({ createdAt: -1 });

    const doctorIds = doctors.map((doctor) => doctor._id.toString());

    let profiles = [];
    if (doctorIds.length > 0) {
      try {
        const profileResponse = await fetchJson(
          `${DOCTOR_SERVICE_URL}/api/internal/doctors/profiles/by-user-ids`,
          {
            method: "POST",
            body: JSON.stringify({ userIds: doctorIds }),
          }
        );
        profiles = Array.isArray(profileResponse?.profiles)
          ? profileResponse.profiles
          : [];
      } catch (error) {
        console.error(
          `Failed to fetch doctor profiles from doctor-service: ${error.message}`
        );
        profiles = [];
      }
    }

    const profileMap = new Map();
    profiles.forEach((profile) => {
      if (profile?.userId) {
        profileMap.set(profile.userId.toString(), profile);
      }
    });

    const result = doctors.map((doctor) => ({
      id: doctor._id,
      userId: doctor.userId,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      role: doctor.role,
      doctorVerificationStatus: doctor.doctorVerificationStatus,
      profile: profileMap.get(doctor._id.toString()) || null,
    }));

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const verifyDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const doctor = await User.findOne({ _id: id, role: "doctor" });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.doctorVerificationStatus = status;
    await doctor.save();

    await sendDoctorVerificationNotification({
      email: doctor.email,
      name: doctor.name,
      status,
    });

    return res.status(200).json({
      message: `Doctor ${status} successfully`,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      message: "User deactivated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = true;
    await user.save();

    return res.status(200).json({
      message: "User activated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getPendingDoctors,
  verifyDoctor,
  deactivateUser,
  activateUser,
};