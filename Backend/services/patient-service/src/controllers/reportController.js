const { getInternalServiceHeaders } = require("../utils/internalServiceAuth");
const MedicalReport = require("../models/MedicalReport");
const getNextSequence = require("../utils/getNextSequence");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");
const cloudinary = require("../config/cloudinary");

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

const getPatientByNic = async (nic) => {
  return fetchJson(
    `${AUTH_INTERNAL_SERVICE_URL}/api/internal/users/by-nic/${encodeURIComponent(nic)}`
  );
};

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

    const patientResponse = await getUserById(patientUserId);
    const patient = patientResponse?.user || patientResponse;

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

    const doctorResponse = await getUserById(doctorUserId);
    const doctor = doctorResponse?.user || doctorResponse;

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    const patientResponse = await getUserById(patientId);
    const patient = patientResponse?.user || patientResponse;

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ message: "Patient user not found" });
    }

    const reports = await MedicalReport.find({
      patientId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      patient: {
        id: patient._id || patient.id,
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

    const doctorResponse = await getUserById(doctorUserId);
    const doctor = doctorResponse?.user || doctorResponse;

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor user not found" });
    }

    const normalizedNic = nic.trim().toUpperCase();

    const patientResponse = await getPatientByNic(normalizedNic);
    const patient = patientResponse?.user || patientResponse;

    if (!patient || patient.role !== "patient" || patient.isActive === false) {
      return res.status(404).json({ message: "Patient not found for given NIC" });
    }

    const patientId = (patient._id || patient.id).toString();

    const reports = await MedicalReport.find({
      patientId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      patient: {
        id: patient._id || patient.id,
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

    const doctorResponse = await getUserById(doctorUserId);
    const doctor = doctorResponse?.user || doctorResponse;

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

    const patientResponse = await getUserById(report.patientId);
    const patient = patientResponse?.user || patientResponse;

    return res.status(200).json({
      ...report.toObject(),
      patient: patient
        ? {
            id: patient._id || patient.id,
            userId: patient.userId,
            nic: patient.nic || "",
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            role: patient.role,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

const openReportForDoctor = async (req, res, next) => {
  try {
    const doctorUserId = req.user.id;
    const { id } = req.params;

    const doctorResponse = await getUserById(doctorUserId);
    const doctor = doctorResponse?.user || doctorResponse;

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
    const reports = await MedicalReport.find({ isDeleted: false }).sort({
      createdAt: -1,
    });

    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        try {
          const patientResponse = await getUserById(report.patientId);
          const patient = patientResponse?.user || patientResponse;

          return {
            ...report.toObject(),
            patient: patient
              ? {
                  id: patient._id || patient.id,
                  userId: patient.userId,
                  nic: patient.nic || "",
                  name: patient.name,
                  email: patient.email,
                  phone: patient.phone,
                  role: patient.role,
                }
              : null,
          };
        } catch {
          return {
            ...report.toObject(),
            patient: null,
          };
        }
      })
    );

    return res.status(200).json(enrichedReports);
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