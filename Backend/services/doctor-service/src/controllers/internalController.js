const DoctorProfile = require("../models/DoctorProfile");

const getDoctorProfilesByUserIdsInternal = async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }

    const profiles = await DoctorProfile.find({
      userId: { $in: userIds },
    }).sort({ createdAt: -1 });

    return res.status(200).json({ profiles });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctorProfilesByUserIdsInternal,
};