const MedicalReport = require("../models/MedicalReport");
const User = require("../models/User");
const getNextSequence = require("../utils/getNextSequence");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");
const cloudinary = require("../config/cloudinary");

const uploadMyReport = async (req, res, next) => {
  try {
    const patientUserId = req.user.id;
    const { title, description, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Report file is required" });
    }

    if (!title) {
      return res.status(400).json({ message: "Report title is required" });
    }

    const patient = await User.findById(patientUserId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient user not found" });
    }

    const nextReportId = await getNextSequence("reportId");

    const folder = process.env.CLOUDINARY_REPORTS_FOLDER || "healthcare/reports";

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder,
      public_id: `report_${nextReportId}_${Date.now()}`,
      resource_type: "auto",
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    });

    const report = await MedicalReport.create({
      reportId: nextReportId,
      patientId: patientUserId,
      uploadedBy: patientUserId,
      title,
      description: description || "",
      category: category || "general",
      originalFileName: req.file.originalname,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryAssetId: uploadResult.asset_id,
      cloudinaryUrl: uploadResult.url,
      cloudinarySecureUrl: uploadResult.secure_url,
      resourceType: uploadResult.resource_type,
      format: uploadResult.format || "",
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    return res.status(201).json({
      message: "Medical report uploaded successfully",
      report,
    });
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const patientUserId = req.user.id;

    const reports = await MedicalReport.find({
      patientId: patientUserId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

const getMyReportById = async (req, res, next) => {
  try {
    const patientUserId = req.user.id;
    const { id } = req.params;

    const report = await MedicalReport.findOne({
      _id: id,
      patientId: patientUserId,
      isDeleted: false,
    });

    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    return res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

const openMyReport = async (req, res, next) => {
  try {
    const patientUserId = req.user.id;
    const { id } = req.params;

    const report = await MedicalReport.findOne({
      _id: id,
      patientId: patientUserId,
      isDeleted: false,
    });

    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    return res.redirect(report.cloudinarySecureUrl);
  } catch (error) {
    next(error);
  }
};

const deleteMyReport = async (req, res, next) => {
  try {
    const patientUserId = req.user.id;
    const { id } = req.params;

    const report = await MedicalReport.findOne({
      _id: id,
      patientId: patientUserId,
      isDeleted: false,
    });

    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    await cloudinary.uploader.destroy(report.cloudinaryPublicId, {
      resource_type: report.resourceType || "raw",
    });

    report.isDeleted = true;
    await report.save();

    return res.status(200).json({
      message: "Medical report deleted successfully",
      report,
    });
  } catch (error) {
    next(error);
  }
};

const getReportsByPatientIdForDoctor = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const { patientId } = req.params;

    const doctor = await User.findById(doctorUserId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient user not found" });
    }

    const reports = await MedicalReport.find({
      patientId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      patient: {
        id: patient._id,
        userId: patient.userId,
        nic: patient.nic || "",
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
      },
      reports,
    });
  } catch (error) {
    next(error);
  }
};

const getReportsByPatientNicForDoctor = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const { nic } = req.params;

    const doctor = await User.findById(doctorUserId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    const normalizedNic = nic.trim().toUpperCase();

    const patient = await User.findOne({
      nic: normalizedNic,
      role: "patient",
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found for given NIC" });
    }

    const reports = await MedicalReport.find({
      patientId: patient._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      patient: {
        id: patient._id,
        userId: patient.userId,
        nic: patient.nic || "",
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
      },
      reports,
    });
  } catch (error) {
    next(error);
  }
};

const getReportByIdForDoctor = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const { id } = req.params;

    const doctor = await User.findById(doctorUserId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    const report = await MedicalReport.findOne({
      _id: id,
      isDeleted: false,
    }).populate("patientId", "userId nic name email phone role");

    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    return res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

const openReportForDoctor = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const { id } = req.params;

    const doctor = await User.findById(doctorUserId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    const report = await MedicalReport.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    return res.redirect(report.cloudinarySecureUrl);
  } catch (error) {
    next(error);
  }
};

const getAllReportsForAdmin = async (req, res, next) => {
  try {
    const reports = await MedicalReport.find({ isDeleted: false })
      .populate("patientId", "userId nic name email phone role")
      .sort({ createdAt: -1 });

    return res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadMyReport,
  getMyReports,
  getMyReportById,
  openMyReport,
  deleteMyReport,
  getReportsByPatientIdForDoctor,
  getReportsByPatientNicForDoctor,
  getReportByIdForDoctor,
  openReportForDoctor,
  getAllReportsForAdmin,
};