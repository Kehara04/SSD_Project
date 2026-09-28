const mongoose = require("mongoose");
const Prescription = require("../models/Prescription");
const getNextSequence = require("../utils/getNextSequence");
const {
  getAppointmentById,
} = require("../services/appointmentService");
const {
  sendPrescriptionNotification,
} = require("../services/notificationService");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeMedicines = (medicines) => {
  if (!Array.isArray(medicines)) return [];

  return medicines
    .map((item) => ({
      medicineName: item?.medicineName?.trim() || "",
      dosage: item?.dosage?.trim() || "",
      frequency: item?.frequency?.trim() || "",
      duration: item?.duration?.trim() || "",
      instructions: item?.instructions?.trim() || "",
    }))
    .filter((item) => item.medicineName);
};

const createPrescriptionForAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { diagnosis, symptoms, medicines, advice, notes, followUpDate } = req.body;

    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    if (!diagnosis || !String(diagnosis).trim()) {
      return res.status(400).json({ message: "Diagnosis is required" });
    }

    const existingPrescription = await Prescription.findOne({ appointmentId });

    if (existingPrescription) {
      return res.status(409).json({
        message: "A prescription already exists for this appointment",
        prescription: existingPrescription,
      });
    }

    let appointment;
    try {
      appointment = await getAppointmentById(
        appointmentId,
        req.headers.authorization
      );
    } catch (error) {
      return res.status(error.response?.status || 500).json({
        message:
          error.response?.data?.message ||
          "Failed to fetch appointment from appointment-service",
      });
    }

    if (!["approved", "completed"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Prescription can only be added for approved or completed appointments",
      });
    }

    if (appointment.doctorId !== req.user.id) {
      return res.status(403).json({
        message: "Forbidden: You can only create prescriptions for your own appointments",
      });
    }

    const normalizedMedicines = normalizeMedicines(medicines);
    const nextPrescriptionId = await getNextSequence("prescriptionId");

    const prescription = await Prescription.create({
      prescriptionId: nextPrescriptionId,
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,

      patientSnapshot: {
        userId: appointment.patientSnapshot?.userId || null,
        name: appointment.patientSnapshot?.name || "",
        email: appointment.patientSnapshot?.email || "",
        phone: appointment.patientSnapshot?.phone || "",
      },

      doctorSnapshot: {
        userId: appointment.doctorSnapshot?.userId || null,
        name: appointment.doctorSnapshot?.name || "",
        email: appointment.doctorSnapshot?.email || "",
        phone: appointment.doctorSnapshot?.phone || "",
        specialization: appointment.doctorSnapshot?.specialization || "",
        hospitalOrClinic: appointment.doctorSnapshot?.hospitalOrClinic || "",
      },

      appointmentSnapshot: {
        appointmentDate: appointment.appointmentDate || "",
        appointmentTime: appointment.appointmentTime || "",
        consultationType: appointment.consultationType || "in_person",
        specialty: appointment.specialty || "",
        reason: appointment.reason || "",
        status: appointment.status || "",
      },

      diagnosis: String(diagnosis).trim(),
      symptoms: symptoms ? String(symptoms).trim() : "",
      medicines: normalizedMedicines,
      advice: advice ? String(advice).trim() : "",
      notes: notes ? String(notes).trim() : "",
      followUpDate: followUpDate ? String(followUpDate).trim() : "",
    });

    await sendPrescriptionNotification({ prescription });

    return res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

const updatePrescriptionByDoctor = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const { diagnosis, symptoms, medicines, advice, notes, followUpDate, isActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid prescription id" });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      doctorId,
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (diagnosis !== undefined) {
      if (!String(diagnosis).trim()) {
        return res.status(400).json({ message: "Diagnosis cannot be empty" });
      }
      prescription.diagnosis = String(diagnosis).trim();
    }

    if (symptoms !== undefined) prescription.symptoms = String(symptoms).trim();
    if (advice !== undefined) prescription.advice = String(advice).trim();
    if (notes !== undefined) prescription.notes = String(notes).trim();
    if (followUpDate !== undefined) prescription.followUpDate = String(followUpDate).trim();
    if (isActive !== undefined) prescription.isActive = Boolean(isActive);

    if (medicines !== undefined) {
      prescription.medicines = normalizeMedicines(medicines);
    }

    await prescription.save();

    return res.status(200).json({
      message: "Prescription updated successfully",
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

const getPrescriptionByAppointmentForDoctor = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const { appointmentId } = req.params;

    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const prescription = await Prescription.findOne({
      appointmentId,
      doctorId,
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found for this appointment" });
    }

    return res.status(200).json(prescription);
  } catch (error) {
    next(error);
  }
};

const getPrescriptionByAppointmentForPatient = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { appointmentId } = req.params;

    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment id" });
    }

    const prescription = await Prescription.findOne({
      appointmentId,
      patientId,
      isActive: true,
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found for this appointment" });
    }

    return res.status(200).json(prescription);
  } catch (error) {
    next(error);
  }
};

const listDoctorPrescriptions = async (req, res, next) => {
  try {
    const doctorId = req.user.id;

    const prescriptions = await Prescription.find({
      doctorId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(prescriptions);
  } catch (error) {
    next(error);
  }
};

const listPatientPrescriptions = async (req, res, next) => {
  try {
    const patientId = req.user.id;

    const prescriptions = await Prescription.find({
      patientId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json(prescriptions);
  } catch (error) {
    next(error);
  }
};

const getDoctorPrescriptionById = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid prescription id" });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      doctorId,
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    return res.status(200).json(prescription);
  } catch (error) {
    next(error);
  }
};

const getPatientPrescriptionById = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid prescription id" });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      patientId,
      isActive: true,
    });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    return res.status(200).json(prescription);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescriptionForAppointment,
  updatePrescriptionByDoctor,
  getPrescriptionByAppointmentForDoctor,
  getPrescriptionByAppointmentForPatient,
  listDoctorPrescriptions,
  listPatientPrescriptions,
  getDoctorPrescriptionById,
  getPatientPrescriptionById,
};
