const MedicalReport = require("../models/MedicalReport");
const getNextSequence = require("../utils/getNextSequence");
const { uploadBufferToCloudinary } = require("../utils/uploadToCloudinary");
const cloudinary = require("../config/cloudinary");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5001";

/*
 * NEW FOR VULN-03:
 * Patient service uses the appointment service to verify whether
 * the logged-in doctor has a legitimate relationship with the patient.
 */
const APPOINTMENT_SERVICE_URL =
  process.env.APPOINTMENT_SERVICE_URL || "http://localhost:5003";

/*
 * Only these appointment states allow a doctor to access
 * the patient's medical reports.
 */
const ALLOWED_REPORT_ACCESS_STATUSES = new Set([
  "approved",
  "completed",
]);

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

const getUserById = async (userId) => {
  return fetchJson(`${AUTH_SERVICE_URL}/api/internal/users/${userId}`);
};

const getPatientByNic = async (nic) => {
  return fetchJson(
    `${AUTH_SERVICE_URL}/api/internal/users/by-nic/${encodeURIComponent(nic)}`
  );
};

/*
 * =========================================================
 * VULN-03 FIX
 * =========================================================
 */

/*
 * Checks whether the currently logged-in doctor has an
 * approved/completed appointment with the requested patient.
 *
 * The doctor's JWT is forwarded to:
 *
 * GET /api/appointments/doctor/my
 *
 * The appointment service already uses the JWT to return only
 * appointments belonging to that doctor.
 */
const doctorHasPatientAccess = async (req, patientId) => {
  const authorizationHeader = req.headers.authorization;

  /*
   * Normally this is already guaranteed by the authenticate middleware,
   * but fail closed if the token is unexpectedly missing.
   */
  if (!authorizationHeader) {
    return false;
  }

  const appointments = await fetchJson(
    `${APPOINTMENT_SERVICE_URL}/api/appointments/doctor/my`,
    {
      headers: {
        Authorization: authorizationHeader,
      },
    }
  );

  /*
   * Fail closed if appointment service does not return the expected array.
   */
  if (!Array.isArray(appointments)) {
    return false;
  }

  const requestedPatientId = String(patientId);

  return appointments.some((appointment) => {
    const appointmentPatientId = String(appointment.patientId);

    const samePatient =
      appointmentPatientId === requestedPatientId;

    const allowedStatus =
      ALLOWED_REPORT_ACCESS_STATUSES.has(appointment.status);

    return samePatient && allowedStatus;
  });
};

/*
 * Reusable object-level authorization helper.
 *
 * Returns true when access is allowed.
 * Sends 403 and returns false when the doctor does not have
 * permission to access that patient's reports.
 */
const ensureDoctorPatientAccess = async (
  req,
  res,
  patientId
) => {
  const hasAccess = await doctorHasPatientAccess(
    req,
    patientId
  );

  if (!hasAccess) {
    res.status(403).json({
      message:
        "Forbidden: You are not authorized to access this patient's medical reports",
    });

    return false;
  }

  return true;
};

const uploadMyReport = async (req, res, next) => {
  try {
    const patientUserId = req.user.id;
    const { title, description, category } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Report file is required",
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "Report title is required",
      });
    }

    const patientResponse = await getUserById(
      patientUserId
    );

    const patient =
      patientResponse?.user || patientResponse;

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        message: "Patient user not found",
      });
    }

    const nextReportId =
      await getNextSequence("reportId");

    const folder =
      process.env.CLOUDINARY_REPORTS_FOLDER ||
      "healthcare/reports";

    const uploadResult =
      await uploadBufferToCloudinary(
        req.file.buffer,
        {
          folder,
          public_id: `report_${nextReportId}_${Date.now()}`,
          resource_type: "auto",
          use_filename: true,
          unique_filename: false,
          overwrite: false,
        }
      );

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
      message:
        "Medical report uploaded successfully",
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
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

const getMyReportById = async (
  req,
  res,
  next
) => {
  try {
    const patientUserId = req.user.id;
    const { id } = req.params;

    const report = await MedicalReport.findOne({
      _id: id,
      patientId: patientUserId,
      isDeleted: false,
    });

    if (!report) {
      return res.status(404).json({
        message: "Medical report not found",
      });
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
      return res.status(404).json({
        message: "Medical report not found",
      });
    }

    return res.redirect(
      report.cloudinarySecureUrl
    );
  } catch (error) {
    next(error);
  }
};

const deleteMyReport = async (
  req,
  res,
  next
) => {
  try {
    const patientUserId = req.user.id;
    const { id } = req.params;

    const report = await MedicalReport.findOne({
      _id: id,
      patientId: patientUserId,
      isDeleted: false,
    });

    if (!report) {
      return res.status(404).json({
        message: "Medical report not found",
      });
    }

    await cloudinary.uploader.destroy(
      report.cloudinaryPublicId,
      {
        resource_type:
          report.resourceType || "raw",
      }
    );

    report.isDeleted = true;
    await report.save();

    return res.status(200).json({
      message:
        "Medical report deleted successfully",
      report,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * =========================================================
 * DOCTOR REPORT FUNCTIONS
 * VULN-03 FIXED
 * =========================================================
 */

/*
 * GET reports using patient MongoDB user ID.
 */
const getReportsByPatientIdForDoctor = async (
  req,
  res,
  next
) => {
  try {
    const doctorUserId = req.user.id;
    const { patientId } = req.params;

    /*
     * Existing role validation.
     */
    const doctorResponse =
      await getUserById(doctorUserId);

    const doctor =
      doctorResponse?.user ||
      doctorResponse;

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        message: "Doctor user not found",
      });
    }

    /*
     * Confirm requested patient exists.
     */
    const patientResponse =
      await getUserById(patientId);

    const patient =
      patientResponse?.user ||
      patientResponse;

    if (!patient || patient.role !== "patient") {
      return res.status(404).json({
        message: "Patient user not found",
      });
    }

    /*
     * VULN-03 FIX:
     * Role=doctor is not enough.
     *
     * Check whether this specific doctor has
     * access to this specific patient.
     */
    const authorized =
      await ensureDoctorPatientAccess(
        req,
        res,
        patientId
      );

    if (!authorized) {
      return;
    }

    /*
     * Only query reports AFTER authorization succeeds.
     */
    const reports = await MedicalReport.find({
      patientId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });

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

/*
 * GET reports using patient NIC.
 */
const getReportsByPatientNicForDoctor = async (
  req,
  res,
  next
) => {
  try {
    const doctorUserId = req.user.id;
    const { nic } = req.params;

    /*
     * Existing doctor validation.
     */
    const doctorResponse =
      await getUserById(doctorUserId);

    const doctor =
      doctorResponse?.user ||
      doctorResponse;

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        message: "Doctor user not found",
      });
    }

    const normalizedNic =
      nic.trim().toUpperCase();

    /*
     * Resolve NIC to patient.
     */
    const patientResponse =
      await getPatientByNic(normalizedNic);

    const patient =
      patientResponse?.user ||
      patientResponse;

    if (
      !patient ||
      patient.role !== "patient" ||
      patient.isActive === false
    ) {
      return res.status(404).json({
        message:
          "Patient not found for given NIC",
      });
    }

    const patientId = String(
      patient._id || patient.id
    );

    /*
     * VULN-03 FIX:
     * Doctor must have an approved/completed
     * appointment with this patient.
     */
    const authorized =
      await ensureDoctorPatientAccess(
        req,
        res,
        patientId
      );

    if (!authorized) {
      return;
    }

    const reports = await MedicalReport.find({
      patientId,
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });

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

/*
 * GET one report using report MongoDB _id.
 */
const getReportByIdForDoctor = async (
  req,
  res,
  next
) => {
  try {
    const doctorUserId = req.user.id;
    const { id } = req.params;

    /*
     * Existing doctor validation.
     */
    const doctorResponse =
      await getUserById(doctorUserId);

    const doctor =
      doctorResponse?.user ||
      doctorResponse;

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        message: "Doctor user not found",
      });
    }

    /*
     * Find the requested report.
     */
    const report = await MedicalReport.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!report) {
      return res.status(404).json({
        message: "Medical report not found",
      });
    }

    /*
     * VULN-03 FIX:
     *
     * The patient ID comes from the report itself,
     * NOT from a client-controlled parameter.
     *
     * Then verify that the logged-in doctor has
     * permission to access this patient's records.
     */
    const authorized =
      await ensureDoctorPatientAccess(
        req,
        res,
        report.patientId
      );

    if (!authorized) {
      return;
    }

    /*
     * Only retrieve the patient details AFTER
     * object-level authorization succeeds.
     */
    const patientResponse =
      await getUserById(report.patientId);

    const patient =
      patientResponse?.user ||
      patientResponse;

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

/*
 * Open/download a report as a doctor.
 */
const openReportForDoctor = async (
  req,
  res,
  next
) => {
  try {
    const doctorUserId = req.user.id;
    const { id } = req.params;

    /*
     * Existing doctor validation.
     */
    const doctorResponse =
      await getUserById(doctorUserId);

    const doctor =
      doctorResponse?.user ||
      doctorResponse;

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({
        message: "Doctor user not found",
      });
    }

    /*
     * Locate the requested report.
     */
    const report = await MedicalReport.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!report) {
      return res.status(404).json({
        message: "Medical report not found",
      });
    }

    /*
     * VULN-03 FIX:
     *
     * Prevent bypassing the protected JSON endpoint
     * by directly requesting /doctor/:id/open.
     */
    const authorized =
      await ensureDoctorPatientAccess(
        req,
        res,
        report.patientId
      );

    if (!authorized) {
      return;
    }

    /*
     * Only redirect to Cloudinary after authorization.
     */
    return res.redirect(
      report.cloudinarySecureUrl
    );
  } catch (error) {
    next(error);
  }
};

/*
 * =========================================================
 * ADMIN REPORT FUNCTIONS
 * =========================================================
 */

const getAllReportsForAdmin = async (
  req,
  res,
  next
) => {
  try {
    const reports = await MedicalReport.find({
      isDeleted: false,
    }).sort({
      createdAt: -1,
    });

    const enrichedReports =
      await Promise.all(
        reports.map(async (report) => {
          try {
            const patientResponse =
              await getUserById(
                report.patientId
              );

            const patient =
              patientResponse?.user ||
              patientResponse;

            return {
              ...report.toObject(),

              patient: patient
                ? {
                    id:
                      patient._id ||
                      patient.id,
                    userId:
                      patient.userId,
                    nic:
                      patient.nic || "",
                    name:
                      patient.name,
                    email:
                      patient.email,
                    phone:
                      patient.phone,
                    role:
                      patient.role,
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

    return res
      .status(200)
      .json(enrichedReports);
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