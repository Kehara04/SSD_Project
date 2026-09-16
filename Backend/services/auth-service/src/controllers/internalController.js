const User = require("../models/User");

const getUserByIdInternal = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const updateUserBasicInternal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, nic } = req.body;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    if (nic !== undefined) {
      const normalizedNic = nic.trim().toUpperCase();

      const existingNicUser = await User.findOne({
        nic: normalizedNic,
        _id: { $ne: id },
      });

      if (existingNicUser) {
        return res.status(409).json({ message: "NIC already in use" });
      }

      user.nic = normalizedNic;
    }

    await user.save();

    const updatedUser = await User.findById(id).select("-password");

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

const checkNicAvailabilityInternal = async (req, res, next) => {
  try {
    const { nic } = req.params;
    const { excludeId } = req.query;

    const normalizedNic = nic.trim().toUpperCase();

    const query = { nic: normalizedNic };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingUser = await User.findOne(query).select("_id");

    return res.status(200).json({
      exists: !!existingUser,
    });
  } catch (error) {
    next(error);
  }
};

const getUserByNicInternal = async (req, res, next) => {
  try {
    const { nic } = req.params;

    const normalizedNic = nic.trim().toUpperCase();

    const user = await User.findOne({ nic: normalizedNic }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const getApprovedDoctorsInternal = async (req, res, next) => {
  try {
    const doctors = await User.find({
      role: "doctor",
      isActive: true,
      doctorVerificationStatus: "approved",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ doctors });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserByIdInternal,
  updateUserBasicInternal,
  checkNicAvailabilityInternal,
  getUserByNicInternal,
  getApprovedDoctorsInternal,
};