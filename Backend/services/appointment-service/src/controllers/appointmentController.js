// const Appointment = require("../models/Appointment");
// const axios = require("axios");

// const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
// const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://localhost:5000";
// const NOTIFICATION_SERVICE_URL =
//   process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5007";
// const TELEMEDICINE_SERVICE_URL =
//   process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5004";
// const SERVICE_SECRET = process.env.SERVICE_SECRET || "";

// const sendBookingNotification = async ({
//   email,
//   phone,
//   doctorName,
//   patientName,
//   date,
//   time,
//   consultationType,
//   bookingStatus,
//   recipientRole,
//   doctorResponseNote,
//   videoMeetingUrl,
// }) => {
//   try {
//     await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/booking`, {
//       email,
//       phone,
//       doctorName,
//       patientName,
//       date,
//       time,
//       consultationType,
//       bookingStatus,
//       recipientRole,
//       doctorResponseNote,
//       videoMeetingUrl,
//     });
//   } catch (notifyError) {
//     console.error(
//       "Booking notification failed:",
//       notifyError.response?.data?.message || notifyError.message
//     );
//   }
// };

// const sendApprovedAppointmentNotification = async (appointmentId) => {
//   try {
//     await axios.post(
//       `${NOTIFICATION_SERVICE_URL}/api/notifications/appointments/${appointmentId}/approved`,
//       {},
//       {
//         headers: {
//           "x-service-secret": SERVICE_SECRET,
//         },
//       }
//     );
//   } catch (notifyError) {
//     console.error(
//       "Approved appointment notification failed:",
//       notifyError.response?.data?.message || notifyError.message
//     );
//   }
// };

// const buildScheduledStartTime = (date, time) => {
//   if (!date || !time) return undefined;
//   return `${date}T${time}:00`;
// };

// const getOrCreateVideoMeetingUrl = async (appointment) => {
//   if (appointment.consultationType !== "video") {
//     return "";
//   }

//   try {
//     const existing = await axios.get(
//       `${TELEMEDICINE_SERVICE_URL}/api/sessions/appointment/${appointment._id}`
//     );

//     if (existing?.data?.meetingUrl) {
//       return existing.data.meetingUrl;
//     }
//   } catch (error) {
//     if (error.response?.status !== 404) {
//       console.error("Fetch video session failed:", error.message);
//       return "";
//     }
//   }

//   try {
//     const created = await axios.post(`${TELEMEDICINE_SERVICE_URL}/api/sessions`, {
//       appointmentId: String(appointment._id),
//       doctorId: String(appointment.doctorId),
//       patientId: String(appointment.patientId),
//       scheduledStartTime: buildScheduledStartTime(
//         appointment.appointmentDate,
//         appointment.appointmentTime
//       ),
//     });

//     return created?.data?.meetingUrl || "";
//   } catch (error) {
//     console.error("Create video session failed:", error.message);
//     return "";
//   }
// };

// const SLOT_DURATION_MINUTES = 15;
// const ACTIVE_BOOKING_STATUSES = ["pending", "approved", "rescheduled"];

// const isValidTimeFormat = (time) => {
//   return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
// };

// const DAY_NAMES = [
//   "Sunday",
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday",
// ];

// const normalizeStoredDayName = (value) => {
//   if (!value) return "";

//   const normalized = String(value).trim().toLowerCase();

//   const aliases = {
//     sun: "Sunday",
//     sunday: "Sunday",
//     mon: "Monday",
//     monday: "Monday",
//     tue: "Tuesday",
//     tues: "Tuesday",
//     tuesday: "Tuesday",
//     wed: "Wednesday",
//     wednesday: "Wednesday",
//     thu: "Thursday",
//     thur: "Thursday",
//     thurs: "Thursday",
//     thursday: "Thursday",
//     fri: "Friday",
//     friday: "Friday",
//     sat: "Saturday",
//     saturday: "Saturday",
//   };

//   return aliases[normalized] || "";
// };

// const normalizeDayName = (dateString) => {
//   if (!dateString || typeof dateString !== "string") return null;

//   const parts = dateString.split("-");
//   if (parts.length !== 3) return null;

//   const [year, month, day] = parts.map(Number);
//   const date = new Date(year, month - 1, day);

//   if (isNaN(date.getTime())) return null;

//   return DAY_NAMES[date.getDay()];
// };

// const extractConsultationTypeInput = (body) => {
//   if (!body || typeof body !== "object") return undefined;

//   const candidates = [
//     body.consultationType,
//     body.consultation_type,
//     body.visitType,
//     body.visit_type,
//     body.appointmentType,
//     body.appointment_type,
//     body.mode,
//   ];

//   for (const c of candidates) {
//     if (c !== undefined && c !== null && c !== "") return c;
//   }

//   if (body.isVideoConsultation === true || body.isVideoConsultation === "true" || body.isVideoConsultation === 1) {
//     return "video";
//   }
//   if (body.isVideoConsultation === false || body.isVideoConsultation === "false" || body.isVideoConsultation === 0) {
//     return "in_person";
//   }

//   return undefined;
// };

// const normalizeConsultationType = (value) => {
//   if (value === undefined || value === null || value === "") {
//     return "in_person";
//   }

//   if (typeof value === "boolean") {
//     return value ? "video" : "in_person";
//   }

//   if (typeof value === "number") {
//     if (value === 1) return "video";
//     if (value === 0) return "in_person";
//   }

//   const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");

//   if (
//     [
//       "video",
//       "video_consultation",
//       "video_conference",
//       "video_coference",
//       "video_call",
//       "videocall",
//       "telemedicine",
//       "online",
//       "remote",
//     ].includes(normalized)
//   ) {
//     return "video";
//   }

//   if (normalized.includes("video")) {
//     return "video";
//   }

//   if (["in_person", "inperson", "physical", "normal", "onsite"].includes(normalized)) {
//     return "in_person";
//   }

//   return null;
// };

// const timeToMinutes = (time) => {
//   const [hours, minutes] = String(time).split(":").map(Number);
//   return hours * 60 + minutes;
// };

// const minutesToTime = (minutes) => {
//   const hours = Math.floor(minutes / 60);
//   const mins = minutes % 60;
//   return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
// };

// const formatTimeLabel = (time) => {
//   const [hours, minutes] = String(time).split(":").map(Number);
//   const period = hours >= 12 ? "PM" : "AM";
//   const normalizedHour = hours % 12 || 12;
//   return `${String(normalizedHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
// };

// const isPastDateTime = (dateString, timeString) => {
//   const combined = new Date(`${dateString}T${timeString}:00`);
//   if (Number.isNaN(combined.getTime())) return false;
//   return combined.getTime() < Date.now();
// };

// const getDoctorAndProfile = async (doctorId) => {
//   try {
//     const response = await axios.get(
//       `${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`
//     );

//     const doctor = response.data;

//     if (!doctor || doctor.doctorVerificationStatus !== "approved") {
//       return { error: { status: 404, message: "Approved doctor not found" } };
//     }

//     if (!doctor.profile) {
//       return { error: { status: 404, message: "Doctor profile not found" } };
//     }

//     return {
//       doctor: {
//         _id: doctor.id,
//         userId: doctor.userId,
//         name: doctor.name,
//         email: doctor.email,
//         phone: doctor.phone,
//       },
//       doctorProfile: doctor.profile,
//     };
//   } catch (error) {
//     return {
//       error: {
//         status: 404,
//         message: "Doctor not found from doctor-service",
//       },
//     };
//   }
// };

// const buildDoctorSlotsForDate = async ({ doctorId, appointmentDate, excludeAppointmentId = null }) => {
//   if (!doctorId || !appointmentDate) {
//     return {
//       error: { status: 400, message: "doctorId and date are required" },
//     };
//   }

//   const dayName = normalizeDayName(appointmentDate);
//   if (!dayName) {
//     return {
//       error: { status: 400, message: "Invalid appointment date" },
//     };
//   }

//   const doctorData = await getDoctorAndProfile(doctorId);
//   if (doctorData.error) {
//     return { error: doctorData.error };
//   }

//   const { doctor, doctorProfile } = doctorData;

//   const dayAvailability = doctorProfile.availability.filter(
//     (slot) =>
//       normalizeStoredDayName(slot.day) === dayName &&
//       slot.isAvailable === true
//   );

//   if (!dayAvailability.length) {
//     return {
//       doctor,
//       doctorProfile,
//       dayName,
//       slotDurationMinutes: SLOT_DURATION_MINUTES,
//       slots: [],
//     };
//   }

//   const existingAppointmentsFilter = {
//     doctorId: doctor._id,
//     appointmentDate,
//     status: { $in: ACTIVE_BOOKING_STATUSES },
//   };

//   if (excludeAppointmentId) {
//     existingAppointmentsFilter._id = { $ne: excludeAppointmentId };
//   }

//   const existingAppointments = await Appointment.find(existingAppointmentsFilter).select("appointmentTime");
//   const bookedTimes = new Set(existingAppointments.map((item) => item.appointmentTime));

//   const uniqueSlots = new Map();

//   for (const availability of dayAvailability) {
//     if (!isValidTimeFormat(availability.startTime) || !isValidTimeFormat(availability.endTime)) {
//       continue;
//     }

//     let start = timeToMinutes(availability.startTime);
//     const end = timeToMinutes(availability.endTime);

//     while (start + SLOT_DURATION_MINUTES <= end) {
//       const time = minutesToTime(start);

//       if (!uniqueSlots.has(time)) {
//         const isBooked = bookedTimes.has(time);
//         const inPast = isPastDateTime(appointmentDate, time);

//         uniqueSlots.set(time, {
//           time,
//           label: formatTimeLabel(time),
//           isBooked,
//           isAvailable: !isBooked && !inPast,
//         });
//       }

//       start += SLOT_DURATION_MINUTES;
//     }
//   }

//   const slots = Array.from(uniqueSlots.values()).sort((a, b) => {
//     return timeToMinutes(a.time) - timeToMinutes(b.time);
//   });

//   return {
//     doctor,
//     doctorProfile,
//     dayName,
//     slotDurationMinutes: SLOT_DURATION_MINUTES,
//     slots,
//   };
// };

// const isSlotAllowed = async ({ doctorId, appointmentDate, appointmentTime, excludeAppointmentId = null }) => {
//   const slotData = await buildDoctorSlotsForDate({
//     doctorId,
//     appointmentDate,
//     excludeAppointmentId,
//   });

//   if (slotData.error) return slotData;

//   const selectedSlot = slotData.slots.find((slot) => slot.time === appointmentTime);

//   if (!selectedSlot) {
//     return {
//       error: {
//         status: 400,
//         message: "Selected time is outside the doctor's available slots",
//       },
//     };
//   }

//   if (selectedSlot.isBooked) {
//     return {
//       error: {
//         status: 400,
//         message: "Selected time slot is already booked or pending approval",
//       },
//     };
//   }

//   if (!selectedSlot.isAvailable) {
//     return {
//       error: {
//         status: 400,
//         message: "Selected time slot is not available",
//       },
//     };
//   }

//   return slotData;
// };

// const searchDoctorsForBooking = async (req, res, next) => {
//   try {
//     const {
//       specialization,
//       name,
//       hospitalOrClinic,
//       minFee,
//       maxFee,
//       availableOnly,
//       date,
//       sortBy,
//       order = "asc",
//     } = req.query;

//     // ✅ GET ALL APPROVED DOCTORS FROM DOCTOR SERVICE
//     const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors`);
//     let doctors = response.data;

//     // 🔎 FILTERS (same logic, just applied on response)

//     if (name) {
//       doctors = doctors.filter((d) =>
//         d.name.toLowerCase().includes(name.toLowerCase())
//       );
//     }

//     if (specialization) {
//       doctors = doctors.filter((d) =>
//         d.profile?.specialization
//           ?.toLowerCase()
//           .includes(specialization.toLowerCase())
//       );
//     }

//     if (hospitalOrClinic) {
//       doctors = doctors.filter((d) =>
//         d.profile?.hospitalOrClinic
//           ?.toLowerCase()
//           .includes(hospitalOrClinic.toLowerCase())
//       );
//     }

//     if (minFee || maxFee) {
//       doctors = doctors.filter((d) => {
//         const fee = Number(d.profile?.consultationFee || 0);
//         if (minFee && fee < Number(minFee)) return false;
//         if (maxFee && fee > Number(maxFee)) return false;
//         return true;
//       });
//     }

//     // 🔎 AVAILABLE ONLY FILTER
//     if (availableOnly === "true" && date) {
//       const dayName = normalizeDayName(date);

//       doctors = doctors.filter((d) =>
//         d.profile?.availability?.some(
//           (slot) =>
//             normalizeStoredDayName(slot.day) === dayName &&
//             slot.isAvailable === true
//         )
//       );
//     }

//     // 🔃 SORT
//     if (sortBy === "fee") {
//       doctors.sort((a, b) =>
//         order === "desc"
//           ? b.profile.consultationFee - a.profile.consultationFee
//           : a.profile.consultationFee - b.profile.consultationFee
//       );
//     }

//     if (sortBy === "experience") {
//       doctors.sort((a, b) =>
//         order === "desc"
//           ? b.profile.yearsOfExperience - a.profile.yearsOfExperience
//           : a.profile.yearsOfExperience - b.profile.yearsOfExperience
//       );
//     }

//     return res.status(200).json(doctors);
//   } catch (error) {
//     next(error);
//   }
// };

// const getDoctorAvailableSlots = async (req, res, next) => {
//   try {
//     const { doctorId } = req.params;
//     const { date } = req.query;

//     if (!date) {
//       return res.status(400).json({ message: "date query parameter is required" });
//     }

//     const slotData = await buildDoctorSlotsForDate({
//       doctorId,
//       appointmentDate: date,
//     });

//     if (slotData.error) {
//       return res.status(slotData.error.status).json({
//         message: slotData.error.message,
//       });
//     }

//     return res.status(200).json({
//       doctorId,
//       date,
//       day: slotData.dayName,
//       slotDurationMinutes: slotData.slotDurationMinutes,
//       slots: slotData.slots,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const createAppointment = async (req, res, next) => {
//   try {
//     const patientId = req.user.id;
//     const { doctorId, appointmentDate, appointmentTime, reason, notes } = req.body;

//     const rawConsultationType = extractConsultationTypeInput(req.body);
//     const normalizedConsultationType = normalizeConsultationType(rawConsultationType);
//     if (!normalizedConsultationType) {
//       return res.status(400).json({
//         message: "consultationType must be in_person or video",
//       });
//     }

//     if (!doctorId || !appointmentDate || !appointmentTime) {
//       return res.status(400).json({
//         message: "doctorId, appointmentDate and appointmentTime are required",
//       });
//     }

//     if (!isValidTimeFormat(appointmentTime)) {
//       return res.status(400).json({
//         message: "appointmentTime must be in HH:MM format",
//       });
//     }

//    let patient;

// try {
//   const response = await axios.get(
//     `${AUTH_SERVICE_URL}/api/internal/users/${patientId}`
//   );

//   patient = response.data?.user || response.data;

//   if (!patient || patient.role !== "patient" || patient.isActive === false) {
//     return res.status(404).json({ message: "Patient not found" });
//   }
// } catch (error) {
//   return res.status(404).json({ message: "Patient not found" });
// }

//     if (!patient) {
//       return res.status(404).json({ message: "Patient not found" });
//     }

//     const slotValidation = await isSlotAllowed({
//       doctorId,
//       appointmentDate,
//       appointmentTime,
//     });

//     if (slotValidation.error) {
//       return res.status(slotValidation.error.status).json({
//         message: slotValidation.error.message,
//       });
//     }

// const { doctor, doctorProfile } = slotValidation;

// const inPersonFee = Number(doctorProfile.consultationFee || 0);
// const videoFee = Number(doctorProfile.videoConsultationFee || 0);

// const selectedConsultationFee =
//   normalizedConsultationType === "video"
//     ? (videoFee > 0 ? videoFee : inPersonFee)
//     : inPersonFee;

//     const appointment = await Appointment.create({
//       patientId: patient._id,
//       doctorId: doctor._id,
//       patientSnapshot: {
//         userId: patient.userId,
//         name: patient.name,
//         email: patient.email,
//         phone: patient.phone,
//       },
//       doctorSnapshot: {
//         userId: doctor.userId,
//         name: doctor.name,
//         email: doctor.email,
//         phone: doctor.phone,
//         specialization: doctorProfile.specialization,
//         hospitalOrClinic: doctorProfile.hospitalOrClinic,
//         consultationFee: selectedConsultationFee,
//         inPersonConsultationFee: inPersonFee,
//         videoConsultationFee: videoFee,
//       },
//       specialty: doctorProfile.specialization,
//       appointmentDate,
//       appointmentTime,
//       reason: reason || "",
//       notes: notes || "",
//       consultationType: normalizedConsultationType,
//       status: "pending",
//     });

//     // EMAIL ONLY for pending stage
//     await sendBookingNotification({
//       email: patient.email,
//       doctorName: doctor.name,
//       patientName: patient.name,
//       date: appointmentDate,
//       time: appointmentTime,
//       consultationType: normalizedConsultationType,
//       bookingStatus: "pending",
//       recipientRole: "patient",
//     });

//     // EMAIL ONLY for pending stage
//     await sendBookingNotification({
//       email: doctor.email,
//       doctorName: doctor.name,
//       patientName: patient.name,
//       date: appointmentDate,
//       time: appointmentTime,
//       consultationType: normalizedConsultationType,
//       bookingStatus: "pending",
//       recipientRole: "doctor",
//     });

//     return res.status(201).json({
//       message: "Appointment created successfully and waiting for doctor approval",
//       appointment,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const listPatientAppointments = async (req, res, next) => {
//   try {
//     const patientId = req.user.id;
//     const { status } = req.query;

//     const filter = { patientId };

//     if (status) {
//       filter.status = status;
//     }

//     const appointments = await Appointment.find(filter).sort({
//       createdAt: -1,
//     });

//     return res.status(200).json(appointments);
//   } catch (error) {
//     next(error);
//   }
// };

// const listDoctorAppointments = async (req, res, next) => {
//   try {
//     const doctorId = req.user.id;
//     const { status, date } = req.query;

//     const filter = { doctorId };

//     if (status) {
//       filter.status = status;
//     }

//     if (date) {
//       filter.appointmentDate = date;
//     }

//     const appointments = await Appointment.find(filter).sort({
//       createdAt: -1,
//     });

//     return res.status(200).json(appointments);
//   } catch (error) {
//     next(error);
//   }
// };

// const listAllAppointmentsAdmin = async (req, res, next) => {
//   try {
//     const appointments = await Appointment.find({}).sort({ createdAt: -1 });
//     return res.status(200).json(appointments);
//   } catch (error) {
//     next(error);
//   }
// };

// const respondToAppointment = async (req, res, next) => {
//   try {
//     const doctorId = req.user.id;
//     const { id } = req.params;
//     const { status, doctorResponseNote } = req.body;

//     if (!["approved", "rejected"].includes(status)) {
//       return res.status(400).json({
//         message: "Status must be approved or rejected",
//       });
//     }

//     const appointment = await Appointment.findOne({
//       _id: id,
//       doctorId,
//     });

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     if (!["pending", "rescheduled"].includes(appointment.status)) {
//       return res.status(400).json({
//         message: `Cannot ${status} an appointment with status '${appointment.status}'`,
//       });
//     }

//     if (status === "approved") {
//       const conflict = await Appointment.findOne({
//         _id: { $ne: appointment._id },
//         doctorId,
//         appointmentDate: appointment.appointmentDate,
//         appointmentTime: appointment.appointmentTime,
//         status: { $in: ACTIVE_BOOKING_STATUSES },
//       });

//       if (conflict) {
//         return res.status(400).json({
//           message: "Doctor already has another appointment at this date and time",
//         });
//       }
//     }

//     appointment.status = status;
//     appointment.doctorResponseNote = doctorResponseNote || "";
//     await appointment.save();

//     if (status === "approved") {
//       await sendApprovedAppointmentNotification(appointment._id);
//     }

//     return res.status(200).json({
//       message: `Appointment ${status} successfully`,
//       appointment,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const cancelAppointment = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const role = req.user.role;
//     const { id } = req.params;
//     const { cancellationReason } = req.body;

//     const filter = { _id: id };

//     if (role === "patient") filter.patientId = userId;
//     if (role === "doctor") filter.doctorId = userId;

//     const appointment = await Appointment.findOne(filter);

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     if (["cancelled", "completed", "rejected"].includes(appointment.status)) {
//       return res.status(400).json({
//         message: `Cannot cancel appointment with status '${appointment.status}'`,
//       });
//     }

//     appointment.status = "cancelled";
//     appointment.cancellationReason = cancellationReason || "";
//     await appointment.save();

//     return res.status(200).json({
//       message: "Appointment cancelled successfully",
//       appointment,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const rescheduleAppointment = async (req, res, next) => {
//   try {
//     const patientId = req.user.id;
//     const { id } = req.params;
//     const { appointmentDate, appointmentTime } = req.body;

//     if (!appointmentDate || !appointmentTime) {
//       return res.status(400).json({
//         message: "appointmentDate and appointmentTime are required",
//       });
//     }

//     if (!isValidTimeFormat(appointmentTime)) {
//       return res.status(400).json({
//         message: "appointmentTime must be in HH:MM format",
//       });
//     }

//     const appointment = await Appointment.findOne({
//       _id: id,
//       patientId,
//     });

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     if (!["pending", "approved", "rescheduled"].includes(appointment.status)) {
//       return res.status(400).json({
//         message: `Cannot reschedule appointment with status '${appointment.status}'`,
//       });
//     }

//     const slotValidation = await isSlotAllowed({
//       doctorId: appointment.doctorId,
//       appointmentDate,
//       appointmentTime,
//       excludeAppointmentId: appointment._id,
//     });

//     if (slotValidation.error) {
//       return res.status(slotValidation.error.status).json({
//         message: slotValidation.error.message,
//       });
//     }

//     appointment.rescheduleHistory.push({
//       oldDate: appointment.appointmentDate,
//       oldTime: appointment.appointmentTime,
//       newDate: appointmentDate,
//       newTime: appointmentTime,
//       changedBy: "patient",
//     });

//     appointment.appointmentDate = appointmentDate;
//     appointment.appointmentTime = appointmentTime;
//     appointment.status = "rescheduled";
//     await appointment.save();

//     await sendBookingNotification({
//       email: appointment.patientSnapshot?.email,
//       phone: appointment.patientSnapshot?.phone,
//       doctorName: appointment.doctorSnapshot?.name,
//       patientName: appointment.patientSnapshot?.name,
//       date: appointment.appointmentDate,
//       time: appointment.appointmentTime,
//       consultationType: appointment.consultationType,
//       bookingStatus: "pending",
//       recipientRole: "patient",
//       doctorResponseNote:
//         "Your appointment has been rescheduled and is waiting for doctor confirmation.",
//     });

//     await sendBookingNotification({
//       email: appointment.doctorSnapshot?.email,
//       phone: appointment.doctorSnapshot?.phone,
//       doctorName: appointment.doctorSnapshot?.name,
//       patientName: appointment.patientSnapshot?.name,
//       date: appointment.appointmentDate,
//       time: appointment.appointmentTime,
//       consultationType: appointment.consultationType,
//       bookingStatus: "pending",
//       recipientRole: "doctor",
//       doctorResponseNote: "This appointment has been rescheduled by the patient.",
//     });

//     return res.status(200).json({
//       message: "Appointment rescheduled successfully and waiting for doctor confirmation",
//       appointment,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const trackAppointmentStatus = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const role = req.user.role;
//     const { id } = req.params;

//     const filter = { _id: id };

//     if (role === "patient") filter.patientId = userId;
//     if (role === "doctor") filter.doctorId = userId;

//     const appointment = await Appointment.findOne(filter).select(
//        "_id patientSnapshot doctorSnapshot appointmentDate appointmentTime consultationType status doctorResponseNote cancellationReason rescheduleHistory createdAt updatedAt"
//     );

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     return res.status(200).json({
//       appointmentId: appointment._id,
//       patient: appointment.patientSnapshot,
//       doctor: appointment.doctorSnapshot,
//       appointmentDate: appointment.appointmentDate,
//       appointmentTime: appointment.appointmentTime,
//       consultationType: appointment.consultationType,
//       status: appointment.status,
//       doctorResponseNote: appointment.doctorResponseNote,
//       cancellationReason: appointment.cancellationReason,
//       rescheduleHistory: appointment.rescheduleHistory,
//       createdAt: appointment.createdAt,
//       updatedAt: appointment.updatedAt,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// const getAppointmentById = async (req, res, next) => {
//   try {
//     const userId = req.user.id;
//     const role = req.user.role;
//     const { id } = req.params;

//     const appointment = await Appointment.findById(id);

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     if (!["patient", "doctor"].includes(role)) {
//       return res.status(403).json({ message: "Forbidden: Access denied" });
//     }

//     if (role === "patient" && appointment.patientId.toString() !== userId) {
//       return res.status(403).json({ message: "Forbidden: Access denied" });
//     }

//     if (role === "doctor" && appointment.doctorId.toString() !== userId) {
//       return res.status(403).json({ message: "Forbidden: Access denied" });
//     }

//     return res.status(200).json(appointment);
//   } catch (error) {
//     next(error);
//   }
// };

// const getAppointmentNotificationPayload = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const appointment = await Appointment.findById(id);

//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }

//     return res.status(200).json({
//       appointmentId: appointment._id,
//       patientId: appointment.patientId,
//       doctorId: appointment.doctorId,
//       patientSnapshot: appointment.patientSnapshot || {},
//       doctorSnapshot: appointment.doctorSnapshot || {},
//       appointmentDate: appointment.appointmentDate || "",
//       appointmentTime: appointment.appointmentTime || "",
//       consultationType: appointment.consultationType || "in_person",
//       specialty: appointment.specialty || "",
//       reason: appointment.reason || "",
//       status: appointment.status || "",
//       doctorResponseNote: appointment.doctorResponseNote || "",
//       cancellationReason: appointment.cancellationReason || "",
//       videoMeetingUrl: "",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   searchDoctorsForBooking,
//   getDoctorAvailableSlots,
//   createAppointment,
//   listPatientAppointments,
//   listDoctorAppointments,
//   listAllAppointmentsAdmin,
//   respondToAppointment,
//   cancelAppointment,
//   rescheduleAppointment,
//   trackAppointmentStatus,
//   getAppointmentById,
//   getAppointmentNotificationPayload,
// };

const Appointment = require("../models/Appointment");
const axios = require("axios");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || "http://localhost:5000";
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5007";
const TELEMEDICINE_SERVICE_URL =
  process.env.TELEMEDICINE_SERVICE_URL || "http://localhost:5004";
const SERVICE_SECRET = process.env.SERVICE_SECRET || "";

const sendBookingNotification = async ({
  email,
  phone,
  doctorName,
  patientName,
  date,
  time,
  consultationType,
  bookingStatus,
  recipientRole,
  doctorResponseNote,
  videoMeetingUrl,
}) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/booking`, {
      email,
      phone,
      doctorName,
      patientName,
      date,
      time,
      consultationType,
      bookingStatus,
      recipientRole,
      doctorResponseNote,
      videoMeetingUrl,
    });
  } catch (notifyError) {
    console.error(
      "Booking notification failed:",
      notifyError.response?.data?.message || notifyError.message
    );
  }
};

const sendApprovedAppointmentNotification = async (appointmentId) => {
  try {
    await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/appointments/${appointmentId}/approved`,
      {},
      {
        headers: {
          "x-service-secret": SERVICE_SECRET,
        },
      }
    );
  } catch (notifyError) {
    console.error(
      "Approved appointment notification failed:",
      notifyError.response?.data?.message || notifyError.message
    );
  }
};

const buildScheduledStartTime = (date, time) => {
  if (!date || !time) return undefined;
  return `${date}T${time}:00`;
};

const getOrCreateVideoMeetingUrl = async (appointment) => {
  if (appointment.consultationType !== "video") {
    return "";
  }

  try {
    const existing = await axios.get(
      `${TELEMEDICINE_SERVICE_URL}/api/sessions/appointment/${appointment._id}`
    );

    if (existing?.data?.meetingUrl) {
      return existing.data.meetingUrl;
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error("Fetch video session failed:", error.message);
      return "";
    }
  }

  try {
    const created = await axios.post(`${TELEMEDICINE_SERVICE_URL}/api/sessions`, {
      appointmentId: String(appointment._id),
      doctorId: String(appointment.doctorId),
      patientId: String(appointment.patientId),
      scheduledStartTime: buildScheduledStartTime(
        appointment.appointmentDate,
        appointment.appointmentTime
      ),
    });

    return created?.data?.meetingUrl || "";
  } catch (error) {
    console.error("Create video session failed:", error.message);
    return "";
  }
};

const DEFAULT_SLOT_DURATION_MINUTES = 15;
const ACTIVE_BOOKING_STATUSES = ["pending", "approved", "rescheduled"];

const isValidTimeFormat = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const normalizeStoredDayName = (value) => {
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

const normalizeDayName = (dateString) => {
  if (!dateString || typeof dateString !== "string") return null;

  const parts = dateString.split("-");
  if (parts.length !== 3) return null;

  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);

  if (isNaN(date.getTime())) return null;

  return DAY_NAMES[date.getDay()];
};

const extractConsultationTypeInput = (body) => {
  if (!body || typeof body !== "object") return undefined;

  const candidates = [
    body.consultationType,
    body.consultation_type,
    body.visitType,
    body.visit_type,
    body.appointmentType,
    body.appointment_type,
    body.mode,
  ];

  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== "") return c;
  }

  if (
    body.isVideoConsultation === true ||
    body.isVideoConsultation === "true" ||
    body.isVideoConsultation === 1
  ) {
    return "video";
  }
  if (
    body.isVideoConsultation === false ||
    body.isVideoConsultation === "false" ||
    body.isVideoConsultation === 0
  ) {
    return "in_person";
  }

  return undefined;
};

const normalizeConsultationType = (value) => {
  if (value === undefined || value === null || value === "") {
    return "in_person";
  }

  if (typeof value === "boolean") {
    return value ? "video" : "in_person";
  }

  if (typeof value === "number") {
    if (value === 1) return "video";
    if (value === 0) return "in_person";
  }

  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (
    [
      "video",
      "video_consultation",
      "video_conference",
      "video_coference",
      "video_call",
      "videocall",
      "telemedicine",
      "online",
      "remote",
    ].includes(normalized)
  ) {
    return "video";
  }

  if (normalized.includes("video")) {
    return "video";
  }

  if (["in_person", "inperson", "physical", "normal", "onsite"].includes(normalized)) {
    return "in_person";
  }

  return null;
};

const normalizeConsultationModesArray = (value) => {
  const defaultModes = ["in_person", "video"];

  if (value === undefined || value === null || value === "") {
    return defaultModes;
  }

  let rawValues = [];

  if (Array.isArray(value)) {
    rawValues = value.flatMap((item) => {
      if (item === undefined || item === null) return [];
      return String(item)
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    });
  } else {
    rawValues = String(value)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  const normalized = rawValues
    .map((item) => normalizeConsultationType(item))
    .filter(Boolean);

  const unique = [...new Set(normalized)];

  return unique.length ? unique : defaultModes;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const formatTimeLabel = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 || 12;
  return `${String(normalizedHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
};

const isPastDateTime = (dateString, timeString) => {
  const combined = new Date(`${dateString}T${timeString}:00`);
  if (Number.isNaN(combined.getTime())) return false;
  return combined.getTime() < Date.now();
};

const getDoctorAndProfile = async (doctorId) => {
  try {
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/${doctorId}`);
    const doctor = response.data;

    if (!doctor || doctor.doctorVerificationStatus !== "approved") {
      return { error: { status: 404, message: "Approved doctor not found" } };
    }

    if (!doctor.profile) {
      return { error: { status: 404, message: "Doctor profile not found" } };
    }

    return {
      doctor: {
        _id: doctor.id,
        userId: doctor.userId,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
      },
      doctorProfile: doctor.profile,
    };
  } catch (error) {
    return {
      error: {
        status: 404,
        message: "Doctor not found from doctor-service",
      },
    };
  }
};

const findLocationForDoctor = (doctorProfile, locationId) => {
  if (!doctorProfile) return null;

  const locations = Array.isArray(doctorProfile.practiceLocations)
    ? doctorProfile.practiceLocations
    : [];

  if (locationId) {
    const byId = locations.find(
      (location) => String(location._id || location.id || "") === String(locationId)
    );
    if (byId) return byId;
  }

  if (locations.length === 1) return locations[0];

  return null;
};

const resolveSlotLocation = (slot, doctorProfile, requestedLocationId) => {
  const slotLocationId = slot?.locationId ? String(slot.locationId) : "";
  const locationId = requestedLocationId ? String(requestedLocationId) : slotLocationId;
  const location = findLocationForDoctor(doctorProfile, locationId);

  return {
    locationId: location ? String(location._id || location.id) : slotLocationId || undefined,
    locationName: location?.name || slot?.locationName || doctorProfile?.hospitalOrClinic || "",
    location,
  };
};

const buildDoctorSlotsForDate = async ({
  doctorId,
  appointmentDate,
  locationId = null,
  excludeAppointmentId = null,
}) => {
  if (!doctorId || !appointmentDate) {
    return {
      error: { status: 400, message: "doctorId and date are required" },
    };
  }

  const dayName = normalizeDayName(appointmentDate);
  if (!dayName) {
    return {
      error: { status: 400, message: "Invalid appointment date" },
    };
  }

  const doctorData = await getDoctorAndProfile(doctorId);
  if (doctorData.error) {
    return { error: doctorData.error };
  }

  const { doctor, doctorProfile } = doctorData;
  const locations = Array.isArray(doctorProfile.practiceLocations)
    ? doctorProfile.practiceLocations.filter((item) => item.isActive !== false)
    : [];

  if (locationId && !findLocationForDoctor(doctorProfile, locationId)) {
    return {
      error: { status: 404, message: "Selected hospital or clinic not found for this doctor" },
    };
  }

  const dayAvailability = (doctorProfile.availability || []).filter((slot) => {
    const slotDayMatches =
      normalizeStoredDayName(slot.day) === dayName && slot.isAvailable === true;

    if (!slotDayMatches) return false;

    if (!locationId) return true;

    return String(slot.locationId || "") === String(locationId);
  });

  if (!dayAvailability.length) {
    return {
      doctor,
      doctorProfile,
      dayName,
      selectedLocation: findLocationForDoctor(doctorProfile, locationId),
      availableLocations: locations,
      slotDurationMinutes: DEFAULT_SLOT_DURATION_MINUTES,
      slots: [],
    };
  }

  const existingAppointmentsFilter = {
    doctorId: doctor._id,
    appointmentDate,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  };

  if (locationId) {
    existingAppointmentsFilter["practiceLocationSnapshot.locationId"] = String(locationId);
  }

  if (excludeAppointmentId) {
    existingAppointmentsFilter._id = { $ne: excludeAppointmentId };
  }

  const existingAppointments = await Appointment.find(existingAppointmentsFilter).select(
    "appointmentTime practiceLocationSnapshot"
  );
  const bookedTimes = new Set(existingAppointments.map((item) => item.appointmentTime));

  const uniqueSlots = new Map();

  for (const availability of dayAvailability) {
    const slotDurationMinutes = Number(availability.slotDuration) > 0
      ? Number(availability.slotDuration)
      : DEFAULT_SLOT_DURATION_MINUTES;

    if (
      !isValidTimeFormat(availability.startTime) ||
      !isValidTimeFormat(availability.endTime)
    ) {
      continue;
    }

    const resolvedLocation = resolveSlotLocation(availability, doctorProfile, locationId);
    const normalizedModes = normalizeConsultationModesArray(availability.consultationModes);

    let start = timeToMinutes(availability.startTime);
    const end = timeToMinutes(availability.endTime);

    while (start + slotDurationMinutes <= end) {
      const time = minutesToTime(start);
      const slotKey = `${resolvedLocation.locationId || "no_location"}_${time}`;

      if (!uniqueSlots.has(slotKey)) {
        const isBooked = bookedTimes.has(time);
        const inPast = isPastDateTime(appointmentDate, time);

        uniqueSlots.set(slotKey, {
          time,
          label: formatTimeLabel(time),
          isBooked,
          isAvailable: !isBooked && !inPast,
          locationId: resolvedLocation.locationId || "",
          locationName: resolvedLocation.locationName || "",
          slotDuration: slotDurationMinutes,
          consultationModes: normalizedModes,
          consultationFee: Number(
            availability.consultationFee ??
              availability.inPersonFee ??
              doctorProfile.consultationFee ??
              doctorProfile.inPersonFee ??
              0
          ),
          videoConsultationFee: Number(
            availability.videoConsultationFee ??
              availability.videoFee ??
              doctorProfile.videoConsultationFee ??
              doctorProfile.videoFee ??
              0
          ),
        });
      }

      start += slotDurationMinutes;
    }
  }

  const slots = Array.from(uniqueSlots.values()).sort((a, b) => {
    if (a.locationName !== b.locationName) {
      return String(a.locationName).localeCompare(String(b.locationName));
    }
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  return {
    doctor,
    doctorProfile,
    dayName,
    selectedLocation: findLocationForDoctor(doctorProfile, locationId),
    availableLocations: locations,
    slotDurationMinutes: slots[0]?.slotDuration || DEFAULT_SLOT_DURATION_MINUTES,
    slots,
  };
};

const isSlotAllowed = async ({
  doctorId,
  appointmentDate,
  appointmentTime,
  locationId = null,
  excludeAppointmentId = null,
}) => {
  const slotData = await buildDoctorSlotsForDate({
    doctorId,
    appointmentDate,
    locationId,
    excludeAppointmentId,
  });

  if (slotData.error) return slotData;

  const selectedSlot = slotData.slots.find(
    (slot) =>
      slot.time === appointmentTime &&
      (!locationId || String(slot.locationId || "") === String(locationId))
  );

  if (!selectedSlot) {
    return {
      error: {
        status: 400,
        message: "Selected time is outside the doctor's available slots for the selected hospital or clinic",
      },
    };
  }

  if (selectedSlot.isBooked) {
    return {
      error: {
        status: 400,
        message: "Selected time slot is already booked or pending approval",
      },
    };
  }

  if (!selectedSlot.isAvailable) {
    return {
      error: {
        status: 400,
        message: "Selected time slot is not available",
      },
    };
  }

  return {
    ...slotData,
    selectedSlot,
  };
};

const searchDoctorsForBooking = async (req, res, next) => {
  try {
    const {
      specialization,
      name,
      hospitalOrClinic,
      locationId,
      minFee,
      maxFee,
      availableOnly,
      date,
      sortBy,
      order = "asc",
    } = req.query;

    const response = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors`);
    let doctors = response.data;

    if (name) {
      doctors = doctors.filter((d) =>
        d.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    if (specialization) {
      doctors = doctors.filter((d) =>
        d.profile?.specialization
          ?.toLowerCase()
          .includes(specialization.toLowerCase())
      );
    }

    if (hospitalOrClinic) {
      const keyword = hospitalOrClinic.toLowerCase();
      doctors = doctors.filter((d) =>
        (d.profile?.practiceLocations || []).some((location) =>
          String(location?.name || "").toLowerCase().includes(keyword)
        ) ||
        d.profile?.hospitalOrClinic?.toLowerCase().includes(keyword)
      );
    }

    if (locationId) {
      doctors = doctors.filter((d) =>
        (d.profile?.practiceLocations || []).some(
          (location) => String(location?._id || location?.id || "") === String(locationId)
        )
      );
    }

    if (minFee || maxFee) {
      doctors = doctors.filter((d) => {
        const fees = [
          Number(d.profile?.consultationFee || 0),
          ...(d.profile?.availability || []).map((slot) =>
            Number(slot?.consultationFee ?? slot?.inPersonFee ?? 0)
          ),
        ].filter((fee) => Number.isFinite(fee));

        const effectiveFee = fees.length ? Math.min(...fees) : 0;

        if (minFee && effectiveFee < Number(minFee)) return false;
        if (maxFee && effectiveFee > Number(maxFee)) return false;
        return true;
      });
    }

    if (availableOnly === "true" && date) {
      const dayName = normalizeDayName(date);

      doctors = doctors.filter((d) =>
        (d.profile?.availability || []).some((slot) => {
          const dayMatches =
            normalizeStoredDayName(slot.day) === dayName &&
            slot.isAvailable === true;

          if (!dayMatches) return false;
          if (!locationId) return true;
          return String(slot.locationId || "") === String(locationId);
        })
      );
    }

    if (sortBy === "fee") {
      doctors.sort((a, b) => {
        const aFee = Number(a.profile?.consultationFee || 0);
        const bFee = Number(b.profile?.consultationFee || 0);
        return order === "desc" ? bFee - aFee : aFee - bFee;
      });
    }

    if (sortBy === "experience") {
      doctors.sort((a, b) =>
        order === "desc"
          ? Number(b.profile?.yearsOfExperience || 0) - Number(a.profile?.yearsOfExperience || 0)
          : Number(a.profile?.yearsOfExperience || 0) - Number(b.profile?.yearsOfExperience || 0)
      );
    }

    return res.status(200).json(doctors);
  } catch (error) {
    next(error);
  }
};

const getDoctorAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date, locationId } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date query parameter is required" });
    }

    const slotData = await buildDoctorSlotsForDate({
      doctorId,
      appointmentDate: date,
      locationId,
    });

    if (slotData.error) {
      return res.status(slotData.error.status).json({
        message: slotData.error.message,
      });
    }

    return res.status(200).json({
      doctorId,
      date,
      day: slotData.dayName,
      selectedLocation: slotData.selectedLocation || null,
      availableLocations: slotData.availableLocations || [],
      slotDurationMinutes: slotData.slotDurationMinutes,
      slots: slotData.slots,
    });
  } catch (error) {
    next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const {
      doctorId,
      locationId,
      appointmentDate,
      appointmentTime,
      reason,
      notes,
    } = req.body;

    const rawConsultationType = extractConsultationTypeInput(req.body);
    const normalizedConsultationType = normalizeConsultationType(rawConsultationType);
    if (!normalizedConsultationType) {
      return res.status(400).json({
        message: "consultationType must be in_person or video",
      });
    }

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: "doctorId, appointmentDate and appointmentTime are required",
      });
    }

    if (!isValidTimeFormat(appointmentTime)) {
      return res.status(400).json({
        message: "appointmentTime must be in HH:MM format",
      });
    }

    let patient;
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/internal/users/${patientId}`);
      patient = response.data?.user || response.data;

      if (!patient || patient.role !== "patient" || patient.isActive === false) {
        return res.status(404).json({ message: "Patient not found" });
      }
    } catch (error) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const slotValidation = await isSlotAllowed({
      doctorId,
      appointmentDate,
      appointmentTime,
      locationId,
    });

    if (slotValidation.error) {
      return res.status(slotValidation.error.status).json({
        message: slotValidation.error.message,
      });
    }

    const { doctor, doctorProfile, selectedSlot } = slotValidation;
    const selectedLocation =
      findLocationForDoctor(doctorProfile, selectedSlot.locationId) || null;

    const inPersonFee = Number(
      selectedSlot.consultationFee || doctorProfile.consultationFee || 0
    );
    const videoFee = Number(
      selectedSlot.videoConsultationFee || doctorProfile.videoConsultationFee || 0
    );

    const selectedConsultationFee =
      normalizedConsultationType === "video"
        ? videoFee > 0
          ? videoFee
          : inPersonFee
        : inPersonFee;

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      patientSnapshot: {
        userId: patient.userId,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
      },
      doctorSnapshot: {
        userId: doctor.userId,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctorProfile.specialization,
        hospitalOrClinic: selectedLocation?.name || selectedSlot.locationName || doctorProfile.hospitalOrClinic,
        locationId: selectedSlot.locationId || "",
        locationName: selectedLocation?.name || selectedSlot.locationName || "",
        consultationFee: selectedConsultationFee,
        inPersonConsultationFee: inPersonFee,
        videoConsultationFee: videoFee,
      },
      practiceLocationSnapshot: {
        locationId: selectedSlot.locationId || "",
        name: selectedLocation?.name || selectedSlot.locationName || "",
        type: selectedLocation?.type || "clinic",
        address: selectedLocation?.address || "",
        city: selectedLocation?.city || "",
        contactNumber: selectedLocation?.contactNumber || "",
      },
      specialty: doctorProfile.specialization,
      appointmentDate,
      appointmentTime,
      reason: reason || "",
      notes: notes || "",
      consultationType: normalizedConsultationType,
      status: "pending",
    });

    await sendBookingNotification({
      email: patient.email,
      doctorName: doctor.name,
      patientName: patient.name,
      date: appointmentDate,
      time: appointmentTime,
      consultationType: normalizedConsultationType,
      bookingStatus: "pending",
      recipientRole: "patient",
    });

    await sendBookingNotification({
      email: doctor.email,
      doctorName: doctor.name,
      patientName: patient.name,
      date: appointmentDate,
      time: appointmentTime,
      consultationType: normalizedConsultationType,
      bookingStatus: "pending",
      recipientRole: "doctor",
    });

    return res.status(201).json({
      message: "Appointment created successfully and waiting for doctor approval",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const listPatientAppointments = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { status } = req.query;

    const filter = { patientId };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(appointments);
  } catch (error) {
    next(error);
  }
};

const listDoctorAppointments = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const { status, date, locationId } = req.query;

    const filter = { doctorId };

    if (status) filter.status = status;
    if (date) filter.appointmentDate = date;
    if (locationId) filter["practiceLocationSnapshot.locationId"] = String(locationId);

    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(appointments);
  } catch (error) {
    next(error);
  }
};

const listAllAppointmentsAdmin = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });
    return res.status(200).json(appointments);
  } catch (error) {
    next(error);
  }
};

const respondToAppointment = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const { status, doctorResponseNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctorId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!["pending", "rescheduled"].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot ${status} an appointment with status '${appointment.status}'`,
      });
    }

    if (status === "approved") {
      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctorId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        "practiceLocationSnapshot.locationId": appointment.practiceLocationSnapshot?.locationId || "",
        status: { $in: ACTIVE_BOOKING_STATUSES },
      });

      if (conflict) {
        return res.status(400).json({
          message: "Doctor already has another appointment at this date, time, and hospital/clinic",
        });
      }
    }

    appointment.status = status;
    appointment.doctorResponseNote = doctorResponseNote || "";
    await appointment.save();

    if (status === "approved") {
      await sendApprovedAppointmentNotification(appointment._id);
    }

    return res.status(200).json({
      message: `Appointment ${status} successfully`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const filter = { _id: id };
    if (role === "patient") filter.patientId = userId;
    if (role === "doctor") filter.doctorId = userId;

    const appointment = await Appointment.findOne(filter);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (["cancelled", "completed", "rejected"].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot cancel appointment with status '${appointment.status}'`,
      });
    }

    appointment.status = "cancelled";
    appointment.cancellationReason = cancellationReason || "";
    await appointment.save();

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { id } = req.params;
    const { appointmentDate, appointmentTime, locationId } = req.body;

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: "appointmentDate and appointmentTime are required",
      });
    }

    if (!isValidTimeFormat(appointmentTime)) {
      return res.status(400).json({
        message: "appointmentTime must be in HH:MM format",
      });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patientId,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!["pending", "approved", "rescheduled"].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot reschedule appointment with status '${appointment.status}'`,
      });
    }

    const effectiveLocationId =
      locationId || appointment.practiceLocationSnapshot?.locationId || appointment.doctorSnapshot?.locationId;

    const slotValidation = await isSlotAllowed({
      doctorId: appointment.doctorId,
      appointmentDate,
      appointmentTime,
      locationId: effectiveLocationId,
      excludeAppointmentId: appointment._id,
    });

    if (slotValidation.error) {
      return res.status(slotValidation.error.status).json({
        message: slotValidation.error.message,
      });
    }

    const { doctorProfile, selectedSlot } = slotValidation;
    const selectedLocation =
      findLocationForDoctor(doctorProfile, selectedSlot.locationId) || null;

    appointment.rescheduleHistory.push({
      oldDate: appointment.appointmentDate,
      oldTime: appointment.appointmentTime,
      oldLocationId: appointment.practiceLocationSnapshot?.locationId || "",
      oldLocationName: appointment.practiceLocationSnapshot?.name || appointment.doctorSnapshot?.hospitalOrClinic || "",
      newDate: appointmentDate,
      newTime: appointmentTime,
      newLocationId: selectedSlot.locationId || "",
      newLocationName: selectedLocation?.name || selectedSlot.locationName || "",
      changedBy: "patient",
    });

    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    appointment.status = "rescheduled";
    appointment.practiceLocationSnapshot = {
      locationId: selectedSlot.locationId || "",
      name: selectedLocation?.name || selectedSlot.locationName || "",
      type: selectedLocation?.type || "clinic",
      address: selectedLocation?.address || "",
      city: selectedLocation?.city || "",
      contactNumber: selectedLocation?.contactNumber || "",
    };
    appointment.doctorSnapshot.locationId = selectedSlot.locationId || "";
    appointment.doctorSnapshot.locationName = selectedLocation?.name || selectedSlot.locationName || "";
    appointment.doctorSnapshot.hospitalOrClinic =
      selectedLocation?.name || selectedSlot.locationName || appointment.doctorSnapshot.hospitalOrClinic || "";
    appointment.doctorSnapshot.inPersonConsultationFee = Number(
      selectedSlot.consultationFee || appointment.doctorSnapshot.inPersonConsultationFee || 0
    );
    appointment.doctorSnapshot.videoConsultationFee = Number(
      selectedSlot.videoConsultationFee || appointment.doctorSnapshot.videoConsultationFee || 0
    );
    appointment.doctorSnapshot.consultationFee =
      appointment.consultationType === "video"
        ? appointment.doctorSnapshot.videoConsultationFee > 0
          ? appointment.doctorSnapshot.videoConsultationFee
          : appointment.doctorSnapshot.inPersonConsultationFee
        : appointment.doctorSnapshot.inPersonConsultationFee;

    await appointment.save();

    await sendBookingNotification({
      email: appointment.patientSnapshot?.email,
      phone: appointment.patientSnapshot?.phone,
      doctorName: appointment.doctorSnapshot?.name,
      patientName: appointment.patientSnapshot?.name,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      consultationType: appointment.consultationType,
      bookingStatus: "pending",
      recipientRole: "patient",
      doctorResponseNote:
        "Your appointment has been rescheduled and is waiting for doctor confirmation.",
    });

    await sendBookingNotification({
      email: appointment.doctorSnapshot?.email,
      phone: appointment.doctorSnapshot?.phone,
      doctorName: appointment.doctorSnapshot?.name,
      patientName: appointment.patientSnapshot?.name,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      consultationType: appointment.consultationType,
      bookingStatus: "pending",
      recipientRole: "doctor",
      doctorResponseNote: "This appointment has been rescheduled by the patient.",
    });

    return res.status(200).json({
      message: "Appointment rescheduled successfully and waiting for doctor confirmation",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const trackAppointmentStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;

    const filter = { _id: id };
    if (role === "patient") filter.patientId = userId;
    if (role === "doctor") filter.doctorId = userId;

    const appointment = await Appointment.findOne(filter).select(
      "_id patientSnapshot doctorSnapshot practiceLocationSnapshot appointmentDate appointmentTime consultationType status doctorResponseNote cancellationReason rescheduleHistory createdAt updatedAt"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      appointmentId: appointment._id,
      patient: appointment.patientSnapshot,
      doctor: appointment.doctorSnapshot,
      practiceLocation: appointment.practiceLocationSnapshot || {},
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      consultationType: appointment.consultationType,
      status: appointment.status,
      doctorResponseNote: appointment.doctorResponseNote,
      cancellationReason: appointment.cancellationReason,
      rescheduleHistory: appointment.rescheduleHistory,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!["patient", "doctor"].includes(role)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    if (role === "patient" && appointment.patientId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    if (role === "doctor" && appointment.doctorId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    return res.status(200).json(appointment);
  } catch (error) {
    next(error);
  }
};

const getAppointmentNotificationPayload = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      patientSnapshot: appointment.patientSnapshot || {},
      doctorSnapshot: appointment.doctorSnapshot || {},
      practiceLocationSnapshot: appointment.practiceLocationSnapshot || {},
      appointmentDate: appointment.appointmentDate || "",
      appointmentTime: appointment.appointmentTime || "",
      consultationType: appointment.consultationType || "in_person",
      specialty: appointment.specialty || "",
      reason: appointment.reason || "",
      status: appointment.status || "",
      doctorResponseNote: appointment.doctorResponseNote || "",
      cancellationReason: appointment.cancellationReason || "",
      videoMeetingUrl: "",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchDoctorsForBooking,
  getDoctorAvailableSlots,
  createAppointment,
  listPatientAppointments,
  listDoctorAppointments,
  listAllAppointmentsAdmin,
  respondToAppointment,
  cancelAppointment,
  rescheduleAppointment,
  trackAppointmentStatus,
  getAppointmentById,
  getAppointmentNotificationPayload,
};