const { sendEmail } = require("../services/emailService");
const { sendSMS } = require("../services/smsService");
const { getAppointmentNotificationPayload } = require("../services/appointmentService");
const { getVideoMeetingUrlForAppointment, } = require("../services/telemedicineService");
const {
  saveNotificationLog,
  saveChannelNotificationLogs,
  listNotificationLogs,
  getNotificationLogById,
  listEmailNotificationLogs,
  listSmsNotificationLogs,
  getEmailNotificationLogById,
  getSmsNotificationLogById,
} = require("../services/notificationLogService");

const cleanString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeUserId = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildDetailsValue = ({ value, isLink }) => {
  const safeValue = cleanString(value) || "-";

  if (isLink && safeValue !== "-") {
    return `
      <a href="${escapeHtml(safeValue)}" style="color:#0f766e;font-weight:600;text-decoration:underline;" target="_blank" rel="noopener noreferrer">
        Join Meeting
      </a>
      <div style="margin-top:6px;font-size:12px;color:#6b7280;word-break:break-all;">
        ${escapeHtml(safeValue)}
      </div>`;
  }

  return escapeHtml(safeValue);
};

const buildDetailsRows = (details) =>
  details
    .map(
      ({ label, ...valueConfig }) => `
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;color:#111827;width:42%;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111827;">${buildDetailsValue(valueConfig)}</td>
        </tr>`
    )
    .join("");

const buildEmailTemplate = ({
  title,
  intro,
  badgeText,
  badgeColor,
  details = [],
  customContentHtml = "",
}) => `
  <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:24px 28px;background:linear-gradient(135deg,#0f766e,#155e75);color:#ffffff;">
          <div style="font-size:20px;font-weight:700;letter-spacing:0.2px;">${escapeHtml(title)}</div>
          <div style="margin-top:8px;font-size:13px;opacity:0.92;">Healthcare Platform Notification</div>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 28px 8px 28px;">
          <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${badgeColor};color:#ffffff;font-size:12px;font-weight:600;">${escapeHtml(badgeText)}</span>
          <p style="margin:14px 0 0 0;color:#374151;font-size:14px;line-height:1.7;">${escapeHtml(intro)}</p>
        </td>
      </tr>
      ${customContentHtml ? `
      <tr>
        <td style="padding:14px 28px 0 28px;">
          ${customContentHtml}
        </td>
      </tr>` : ""}
      ${details.length ? `
      <tr>
        <td style="padding:14px 28px 24px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;">
            ${buildDetailsRows(details)}
          </table>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:16px 28px;background:#f9fafb;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
          This is an automated message. Please do not reply to this email.
        </td>
      </tr>
    </table>
  </div>`;

const normalizeMedicines = (medicines) => {
  if (!Array.isArray(medicines)) return [];

  return medicines
    .map((item) => ({
      medicineName: cleanString(item?.medicineName),
      dosage: cleanString(item?.dosage),
      frequency: cleanString(item?.frequency),
      duration: cleanString(item?.duration),
      instructions: cleanString(item?.instructions),
    }))
    .filter((item) => item.medicineName);
};

const buildPrescriptionMedicinesTable = (medicines) => {
  const rows = medicines.length
    ? medicines
        .map(
          (medicine, index) => `
          <tr>
            <td style="padding:10px;border:1px solid #e5e7eb;color:#111827;text-align:center;">${index + 1}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;color:#111827;">${escapeHtml(medicine.medicineName || "-")}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;color:#111827;">${escapeHtml(medicine.dosage || "-")}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;color:#111827;">${escapeHtml(medicine.frequency || "-")}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;color:#111827;">${escapeHtml(medicine.duration || "-")}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;color:#111827;">${escapeHtml(medicine.instructions || "-")}</td>
          </tr>`
        )
        .join("")
    : `
      <tr>
        <td colspan="6" style="padding:12px;border:1px solid #e5e7eb;color:#6b7280;text-align:center;">
          No medicines were listed in this prescription.
        </td>
      </tr>`;

  return `
    <div style="margin:0 0 10px 0;color:#111827;font-size:14px;font-weight:600;">Prescribed Medicines</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
      <thead>
        <tr>
          <th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc;color:#111827;text-align:center;">#</th>
          <th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc;color:#111827;text-align:left;">Medicine</th>
          <th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc;color:#111827;text-align:left;">Dosage</th>
          <th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc;color:#111827;text-align:left;">Frequency</th>
          <th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc;color:#111827;text-align:left;">Duration</th>
          <th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc;color:#111827;text-align:left;">Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
};

const formatIssuedAt = (value) => {
  const raw = cleanString(value);
  if (!raw) return "";

  const parsedDate = new Date(raw);
  if (Number.isNaN(parsedDate.getTime())) {
    return raw;
  }

  return parsedDate.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const persistNotificationLog = async ({
  notificationType,
  email,
  phone,
  recipientRole,
  recipientUserId,
  subject,
  message,
  outcomes,
  metadata = {},
  emailHtml = "",
}) => {
  try {
    const savedNotification = await saveNotificationLog({
      notificationType,
      recipient: {
        email,
        phone,
        role: recipientRole,
        userId: normalizeUserId(recipientUserId),
      },
      subject,
      message,
      outcomes,
      metadata,
    });

    await saveChannelNotificationLogs({
      parentNotificationId: savedNotification?._id,
      notificationType,
      recipient: {
        email,
        phone,
        role: recipientRole,
        userId: normalizeUserId(recipientUserId),
      },
      subject,
      message,
      emailHtml,
      outcomes,
      metadata,
    });
  } catch (error) {
    console.error("Failed to persist notification log:", error.message);
  }
};

const dispatchNotification = async ({
  email,
  phone,
  subject,
  message,
  emailHtml,
  notificationType = "general",
  recipientRole = "",
  recipientUserId,
  metadata = {},
}) => {
  const outcomes = [];
  const cleanEmail = cleanString(email);
  const cleanPhone = cleanString(phone);
  let result;

  if (!cleanEmail && !cleanPhone) {
    result = {
      ok: false,
      statusCode: 400,
      message: "At least one recipient is required: email or phone",
      outcomes,
    };
  } else {
    if (cleanEmail) {
      try {
        await sendEmail(cleanEmail, subject, message, emailHtml);
        outcomes.push({ channel: "email", success: true });
      } catch (error) {
        outcomes.push({
          channel: "email",
          success: false,
          error: error.message,
        });
      }
    }

    if (cleanPhone) {
      try {
        await sendSMS(cleanPhone, message);
        outcomes.push({ channel: "sms", success: true });
      } catch (error) {
        outcomes.push({
          channel: "sms",
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = outcomes.filter((item) => item.success).length;
    if (successCount === 0) {
      result = {
        ok: false,
        statusCode: 502,
        message: "Failed to send notification",
        outcomes,
      };
    } else {
      result = { ok: true, outcomes };
    }
  }

  await persistNotificationLog({
    notificationType,
    email: cleanEmail,
    phone: cleanPhone,
    recipientRole,
    recipientUserId,
    subject,
    message,
    emailHtml,
    outcomes,
    metadata,
  });

  return result;
};

const listEmailNotifications = async (req, res) => {
  try {
    const result = await listEmailNotificationLogs(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmailNotificationById = async (req, res) => {
  try {
    const notification = await getEmailNotificationLogById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Email notification not found" });
    }

    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const listSmsNotifications = async (req, res) => {
  try {
    const result = await listSmsNotificationLogs(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSmsNotificationById = async (req, res) => {
  try {
    const notification = await getSmsNotificationLogById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "SMS notification not found" });
    }

    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const sendBookingNotification = async (req, res) => {
  try {
    const {
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
    } = req.body;

    const isDoctorRecipient = recipientRole === "doctor";
    const mode =
      consultationType === "video"
        ? "Video consultation"
        : consultationType === "in_person"
          ? "In-person consultation"
          : "Consultation";

    const subject =
      bookingStatus === "pending" && isDoctorRecipient
        ? "New Appointment Request"
        : "Appointment Confirmation";

    const message = bookingStatus === "pending"
      ? isDoctorRecipient
        ? `${mode} appointment request from ${patientName || "a patient"} for ${date} at ${time}.`
        : `${mode} appointment request received with Dr. ${doctorName} for ${date} at ${time}.`
      : `${mode} appointment confirmed with Dr. ${doctorName} on ${date} at ${time}.`;

    const bookingDetails = isDoctorRecipient
      ? [
          { label: "Patient", value: patientName || "N/A" },
          { label: "Consultation Type", value: mode },
          { label: "Date", value: date },
          { label: "Time", value: time },
          {
            label: "Status",
            value: bookingStatus === "pending" ? "Pending Response" : "Approved",
          },
        ]
      : [
          { label: "Doctor", value: doctorName || "N/A" },
          { label: "Consultation Type", value: mode },
          { label: "Date", value: date },
          { label: "Time", value: time },
          {
            label: "Status",
            value: bookingStatus === "pending" ? "Pending Approval" : "Confirmed",
          },
        ];

    if (bookingStatus === "approved" && cleanString(doctorResponseNote)) {
      bookingDetails.push({
        label: "Doctor Note",
        value: doctorResponseNote,
      });
    }

    if (
      bookingStatus === "approved" &&
      consultationType === "video" &&
      cleanString(videoMeetingUrl)
    ) {
      bookingDetails.push({
        label: "Video Link",
        value: videoMeetingUrl,
        isLink: true,
      });
    }

    const emailHtml = buildEmailTemplate({
      title: "Appointment Update",
      intro: message,
      badgeText: bookingStatus === "pending" ? "Pending" : "Confirmed",
      badgeColor: bookingStatus === "pending" ? "#b45309" : "#166534",
      details: bookingDetails,
    });

    const result = await dispatchNotification({
      email,
      phone,
      subject,
      message,
      emailHtml,
      notificationType: "booking",
      recipientRole: cleanString(recipientRole),
      metadata: {
        doctorName: cleanString(doctorName),
        patientName: cleanString(patientName),
        date: cleanString(date),
        time: cleanString(time),
        consultationType: cleanString(consultationType),
        bookingStatus: cleanString(bookingStatus),
        doctorResponseNote: cleanString(doctorResponseNote),
        videoMeetingUrl: cleanString(videoMeetingUrl),
      },
    });

    if (!result.ok) {
      return res
        .status(result.statusCode)
        .json({ message: result.message, delivery: result.outcomes });
    }

    res.json({ message: "Booking notification sent", delivery: result.outcomes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendCompletionNotification = async (req, res) => {
  try {
    const {
      email,
      phone,
      doctorName,
      date,
      time,
      recipientRole,
      userId,
    } = req.body;

    const message = `Your consultation with Dr. ${doctorName} has been completed.`;
    const emailHtml = buildEmailTemplate({
      title: "Consultation Completed",
      intro: message,
      badgeText: "Completed",
      badgeColor: "#1d4ed8",
      details: [
        { label: "Doctor", value: doctorName || "N/A" },
        { label: "Date", value: date || "N/A" },
        { label: "Time", value: time || "N/A" },
        { label: "Status", value: "Completed" },
      ],
    });

    const result = await dispatchNotification({
      email,
      phone,
      subject: "Consultation Completed",
      message,
      emailHtml,
      notificationType: "completion",
      recipientRole: cleanString(recipientRole),
      recipientUserId: normalizeUserId(userId),
      metadata: {
        doctorName: cleanString(doctorName),
        date: cleanString(date),
        time: cleanString(time),
      },
    });

    if (!result.ok) {
      return res
        .status(result.statusCode)
        .json({ message: result.message, delivery: result.outcomes });
    }

    res.json({ message: "Completion notification sent", delivery: result.outcomes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendPaymentNotification = async (req, res) => {
  try {
    const {
      email,
      phone,
      amount,
      date,
      time,
      status,
      recipientRole,
      userId,
    } = req.body;
    const normalizedStatus = cleanString(status).toLowerCase();
    const isFailed = ["failed", "unsuccessful"].includes(normalizedStatus);

    const message = isFailed
      ? `Payment of LKR ${amount} was unsuccessful.`
      : `Payment of LKR ${amount} successful.`;

    const emailHtml = buildEmailTemplate({
      title: isFailed ? "Payment Unsuccessful" : "Payment Confirmation",
      intro: isFailed
        ? `${message} Please try again or use a different payment method.`
        : message,
      badgeText: isFailed ? "Unsuccessful" : "Paid",
      badgeColor: isFailed ? "#b91c1c" : "#047857",
      details: [
        { label: "Amount", value: `LKR ${amount}` },
        { label: "Date", value: date || "N/A" },
        { label: "Time", value: time || "N/A" },
        { label: "Status", value: isFailed ? "Unsuccessful" : "Successful" },
      ],
    });

    const result = await dispatchNotification({
      email,
      phone,
      subject: isFailed ? "Payment Unsuccessful" : "Payment Confirmation",
      message,
      emailHtml,
      notificationType: "payment",
      recipientRole: cleanString(recipientRole),
      recipientUserId: normalizeUserId(userId),
      metadata: {
        amount,
        date: cleanString(date),
        time: cleanString(time),
        status: cleanString(status),
      },
    });

    if (!result.ok) {
      return res
        .status(result.statusCode)
        .json({ message: result.message, delivery: result.outcomes });
    }

    res.json({ message: "Payment notification sent", delivery: result.outcomes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendWelcomeNotification = async (req, res) => {
  try {
    const { email, name, role, userId, doctorVerificationStatus } = req.body;

    const cleanEmail = cleanString(email);
    const cleanName = cleanString(name);
    const normalizedRole = cleanString(role).toLowerCase();

    if (!cleanEmail || !cleanName || !normalizedRole) {
      return res.status(400).json({
        message: "email, name, and role are required",
      });
    }

    const isDoctor = normalizedRole === "doctor";
    const roleLabel = isDoctor
      ? "Doctor"
      : normalizedRole === "patient"
        ? "Patient"
        : "User";

    const accountStatus = isDoctor
      ? cleanString(doctorVerificationStatus) || "pending"
      : "active";

    const statusLabel =
      accountStatus === "pending"
        ? "Pending Verification"
        : accountStatus === "approved"
          ? "Approved"
          : accountStatus === "rejected"
            ? "Rejected"
            : accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1);

    const subject = `Welcome to MediChannel, ${cleanName}`;
    const message = isDoctor
      ? `Welcome Dr. ${cleanName}. Your MediChannel account is created and currently ${statusLabel.toLowerCase()}.`
      : `Welcome ${cleanName}. Your MediChannel account is ready to use.`;

    const emailHtml = buildEmailTemplate({
      title: "Welcome to MediChannel",
      intro: isDoctor
        ? "Your doctor account has been created successfully. Once verification is completed, you can start accepting appointments. You will receive another email notification with the verification result from our admin team."
        : "Your patient account has been created successfully. You can now book appointments and manage your consultations easily.",
      badgeText: isDoctor ? "Doctor Onboarding" : "Patient Onboarding",
      badgeColor: isDoctor ? "#1d4ed8" : "#0f766e",
      details: [
        { label: "Name", value: cleanName },
        { label: "Role", value: roleLabel },
        { label: "Email", value: cleanEmail },
        { label: "Account Status", value: statusLabel },
      ],
    });

    const result = await dispatchNotification({
      email: cleanEmail,
      subject,
      message,
      emailHtml,
      notificationType: "welcome",
      recipientRole: normalizedRole,
      recipientUserId: normalizeUserId(userId),
      metadata: {
        name: cleanName,
        role: normalizedRole,
        doctorVerificationStatus: cleanString(doctorVerificationStatus),
      },
    });

    if (!result.ok) {
      return res
        .status(result.statusCode)
        .json({ message: result.message, delivery: result.outcomes });
    }

    res.json({ message: "Welcome notification sent", delivery: result.outcomes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendPrescriptionNotification = async (req, res) => {
  try {
    const {
      email,
      patientName,
      doctorName,
      appointmentDate,
      appointmentTime,
      diagnosis,
      symptoms,
      advice,
      notes,
      followUpDate,
      medicines,
      prescriptionId,
      issuedAt,
      recipientRole,
      userId,
    } = req.body;

    const cleanEmail = cleanString(email);
    const cleanPatientName = cleanString(patientName);
    const cleanDoctorName = cleanString(doctorName);
    const cleanDiagnosis = cleanString(diagnosis);
    const cleanSymptoms = cleanString(symptoms);
    const cleanAdvice = cleanString(advice);
    const cleanNotes = cleanString(notes);
    const cleanFollowUpDate = cleanString(followUpDate);
    const cleanAppointmentDate = cleanString(appointmentDate);
    const cleanAppointmentTime = cleanString(appointmentTime);
    const cleanPrescriptionId = cleanString(prescriptionId);
    const normalizedMedicines = normalizeMedicines(medicines);

    if (!cleanEmail) {
      return res.status(400).json({
        message: "email is required",
      });
    }

    const subject = cleanDoctorName
      ? `New Prescription from Dr. ${cleanDoctorName}`
      : "New Prescription Available";

    const message = cleanDoctorName
      ? `Dear ${cleanPatientName || "Patient"}, Dr. ${cleanDoctorName} has shared your prescription.`
      : `Dear ${cleanPatientName || "Patient"}, your prescription is ready.`;

    const emailHtml = buildEmailTemplate({
      title: "Prescription Shared",
      intro:
        "Your doctor has added a prescription for your recent appointment. Please review the details below.",
      badgeText: "Prescription",
      badgeColor: "#1d4ed8",
      customContentHtml: buildPrescriptionMedicinesTable(normalizedMedicines),
      details: [
        { label: "Prescription ID", value: cleanPrescriptionId || "N/A" },
        { label: "Doctor", value: cleanDoctorName ? `Dr. ${cleanDoctorName}` : "N/A" },
        { label: "Appointment Date", value: cleanAppointmentDate || "N/A" },
        { label: "Appointment Time", value: cleanAppointmentTime || "N/A" },
        { label: "Diagnosis", value: cleanDiagnosis || "N/A" },
        { label: "Symptoms", value: cleanSymptoms || "-" },
        { label: "Advice", value: cleanAdvice || "-" },
        { label: "Notes", value: cleanNotes || "-" },
        { label: "Follow Up Date", value: cleanFollowUpDate || "-" },
        { label: "Issued At", value: formatIssuedAt(issuedAt) || "-" },
      ],
    });

    const result = await dispatchNotification({
      email: cleanEmail,
      subject,
      message,
      emailHtml,
      notificationType: "prescription",
      recipientRole: cleanString(recipientRole),
      recipientUserId: normalizeUserId(userId),
      metadata: {
        patientName: cleanPatientName,
        doctorName: cleanDoctorName,
        appointmentDate: cleanAppointmentDate,
        appointmentTime: cleanAppointmentTime,
        diagnosis: cleanDiagnosis,
        symptoms: cleanSymptoms,
        advice: cleanAdvice,
        notes: cleanNotes,
        followUpDate: cleanFollowUpDate,
        prescriptionId: cleanPrescriptionId,
        issuedAt: cleanString(issuedAt),
      },
    });

    if (!result.ok) {
      return res
        .status(result.statusCode)
        .json({ message: result.message, delivery: result.outcomes });
    }

    res.json({ message: "Prescription notification sent", delivery: result.outcomes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendDoctorVerificationNotification = async (req, res) => {
  try {
    const { email, name, status, userId } = req.body;

    const cleanEmail = cleanString(email);
    const cleanName = cleanString(name);
    const normalizedStatus = cleanString(status).toLowerCase();

    if (!cleanEmail || !cleanName || !normalizedStatus) {
      return res.status(400).json({
        message: "email, name, and status are required",
      });
    }

    if (!["approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({
        message: "status must be approved or rejected",
      });
    }

    const isApproved = normalizedStatus === "approved";
    const subject = isApproved
      ? "Doctor Registration Accepted - MediChannel"
      : "Doctor Registration Update - MediChannel";
    const message = isApproved
      ? `Dear Dr. ${cleanName}, your doctor registration has been accepted by the admin team.`
      : `Dear Dr. ${cleanName}, your doctor registration has been rejected by the admin team.`;

    const emailHtml = buildEmailTemplate({
      title: isApproved
        ? "Doctor Registration Accepted"
        : "Doctor Registration Update",
      intro: isApproved
        ? "Great news. Your doctor profile has been accepted by the admin and is now eligible for appointments on MediChannel."
        : "Your doctor profile was reviewed by admin and has not been approved at this time.",
      badgeText: isApproved ? "Accepted" : "Rejected",
      badgeColor: isApproved ? "#166534" : "#b91c1c",
      details: [
        { label: "Doctor Name", value: `Dr. ${cleanName}` },
        { label: "Email", value: cleanEmail },
        { label: "Verification Status", value: isApproved ? "Accepted" : "Rejected" },
      ],
    });

    const result = await dispatchNotification({
      email: cleanEmail,
      subject,
      message,
      emailHtml,
      notificationType: "doctor_verification",
      recipientRole: "doctor",
      recipientUserId: normalizeUserId(userId),
      metadata: {
        name: cleanName,
        status: normalizedStatus,
      },
    });

    if (!result.ok) {
      return res
        .status(result.statusCode)
        .json({ message: result.message, delivery: result.outcomes });
    }

    res.json({
      message: "Doctor verification notification sent",
      delivery: result.outcomes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendToSingleRecipient = async ({
  email,
  phone,
  subject,
  message,
  emailHtml,
  recipientLabel,
  notificationType,
  recipientRole,
  recipientUserId,
  metadata = {},
}) => {
  const result = await dispatchNotification({
    email,
    phone,
    subject,
    message,
    emailHtml,
    notificationType,
    recipientRole,
    recipientUserId,
    metadata,
  });

  return {
    recipient: recipientLabel,
    ...result,
  };
};

const buildModeLabel = (consultationType) =>
  consultationType === "video" ? "Video consultation" : "In-person consultation";

const sendApprovedAppointmentNotificationByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await getAppointmentNotificationPayload(appointmentId);

    if (!appointment || appointment.status !== "approved") {
      return res.status(400).json({
        message: "Appointment is not approved or not found",
      });
    }

    const mode = buildModeLabel(appointment.consultationType);
    const doctorName = cleanString(appointment.doctorSnapshot?.name) || "Doctor";
    const patientName = cleanString(appointment.patientSnapshot?.name) || "Patient";
    const hospitalOrClinic =
      cleanString(appointment.doctorSnapshot?.hospitalOrClinic) || "Not specified";

    let videoMeetingUrl = "";

if (
  appointment.consultationType === "video" &&
  appointment.appointmentDate &&
  appointment.appointmentTime
) {
  try {
    videoMeetingUrl = await getVideoMeetingUrlForAppointment({
      appointmentId: String(appointment.appointmentId),
      doctorId: String(appointment.doctorId),
      patientId: String(appointment.patientId),
      scheduledStartTime: `${appointment.appointmentDate}T${appointment.appointmentTime}:00`,
    });
  } catch (error) {
    console.error(
      "Failed to fetch/create video meeting URL:",
      error.response?.data || error.message
    );
    videoMeetingUrl = "";
  }
}

    const patientSmsMessage =
      appointment.consultationType === "video" && cleanString(videoMeetingUrl)
        ? `MediChannel: Your ${mode.toLowerCase()} with Dr. ${doctorName} is approved. Date: ${appointment.appointmentDate}, Time: ${appointment.appointmentTime}, Clinic: ${hospitalOrClinic}. Join: ${videoMeetingUrl}`
        : `MediChannel: Your ${mode.toLowerCase()} with Dr. ${doctorName} is approved. Date: ${appointment.appointmentDate}, Time: ${appointment.appointmentTime}, Clinic: ${hospitalOrClinic}.`;

    const doctorSmsMessage = `MediChannel: Appointment with ${patientName} is confirmed. Date: ${appointment.appointmentDate}, Time: ${appointment.appointmentTime}, Clinic: ${hospitalOrClinic}.`;

    const patientDetails = [
      { label: "Doctor", value: `Dr. ${doctorName}` },
      { label: "Consultation Type", value: mode },
      { label: "Date", value: appointment.appointmentDate || "N/A" },
      { label: "Time", value: appointment.appointmentTime || "N/A" },
      { label: "Hospital / Clinic", value: hospitalOrClinic },
      { label: "Status", value: "Approved" },
      { label: "Specialty", value: appointment.specialty || "-" },
    ];

    if (cleanString(appointment.doctorResponseNote)) {
      patientDetails.push({
        label: "Doctor Note",
        value: appointment.doctorResponseNote,
      });
    }

    if (
      appointment.consultationType === "video" &&
      cleanString(videoMeetingUrl)
    ) {
      patientDetails.push({
        label: "Video Link",
        value: videoMeetingUrl,
        isLink: true,
      });
    }

    const doctorDetails = [
      { label: "Patient", value: patientName },
      { label: "Consultation Type", value: mode },
      { label: "Date", value: appointment.appointmentDate || "N/A" },
      { label: "Time", value: appointment.appointmentTime || "N/A" },
      { label: "Hospital / Clinic", value: hospitalOrClinic },
      { label: "Status", value: "Approved" },
    ];

    const patientEmailHtml = buildEmailTemplate({
      title: "Appointment Approved",
      intro: `Your appointment with Dr. ${doctorName} has been approved.`,
      badgeText: "Approved",
      badgeColor: "#166534",
      details: patientDetails,
    });

    const doctorEmailHtml = buildEmailTemplate({
      title: "Appointment Confirmed",
      intro: `The appointment with ${patientName} is confirmed.`,
      badgeText: "Confirmed",
      badgeColor: "#1d4ed8",
      details: doctorDetails,
    });

    const appointmentLogMetadata = {
      appointmentId: String(appointment.appointmentId || appointmentId),
      consultationType: cleanString(appointment.consultationType),
      appointmentDate: cleanString(appointment.appointmentDate),
      appointmentTime: cleanString(appointment.appointmentTime),
      hospitalOrClinic,
      doctorName,
      patientName,
      specialty: cleanString(appointment.specialty),
      doctorResponseNote: cleanString(appointment.doctorResponseNote),
      videoMeetingUrl: cleanString(videoMeetingUrl),
      status: cleanString(appointment.status),
    };

    const deliveries = [];

    const patientDelivery = await sendToSingleRecipient({
      email: appointment.patientSnapshot?.email,
      phone: appointment.patientSnapshot?.phone,
      subject: "Appointment Approved",
      message: patientSmsMessage,
      emailHtml: patientEmailHtml,
      recipientLabel: "patient",
      notificationType: "approved_appointment",
      recipientRole: "patient",
      recipientUserId: normalizeUserId(appointment.patientSnapshot?.userId),
      metadata: {
        ...appointmentLogMetadata,
        recipient: "patient",
      },
    });
    deliveries.push(patientDelivery);

    const doctorDelivery = await sendToSingleRecipient({
      email: appointment.doctorSnapshot?.email,
      phone: appointment.doctorSnapshot?.phone,
      subject: "Appointment Confirmed",
      message: doctorSmsMessage,
      emailHtml: doctorEmailHtml,
      recipientLabel: "doctor",
      notificationType: "approved_appointment",
      recipientRole: "doctor",
      recipientUserId: normalizeUserId(appointment.doctorSnapshot?.userId),
      metadata: {
        ...appointmentLogMetadata,
        recipient: "doctor",
      },
    });
    deliveries.push(doctorDelivery);

    const successCount = deliveries.filter((item) => item.ok).length;

    if (successCount === 0) {
      return res.status(502).json({
        message: "Failed to send approved appointment notifications",
        delivery: deliveries,
      });
    }

    return res.status(200).json({
      message: "Approved appointment notifications processed",
      delivery: deliveries,
    });
  } catch (error) {
    console.error(
    "Approved appointment notification failed:",
    error.response?.data || error.message || error
  );

  return res.status(500).json({
    message: error.response?.data?.message || error.message,
  });
  }
};

const listStoredNotifications = async (req, res) => {
  try {
    const result = await listNotificationLogs(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStoredNotificationById = async (req, res) => {
  try {
    const notification = await getNotificationLogById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendBookingNotification,
  sendCompletionNotification,
  sendPaymentNotification,
  sendWelcomeNotification,
  sendPrescriptionNotification,
  sendDoctorVerificationNotification,
  sendApprovedAppointmentNotificationByAppointmentId,
  listStoredNotifications,
  getStoredNotificationById,
  listEmailNotifications,
  getEmailNotificationById,
  listSmsNotifications,
  getSmsNotificationById,
};
