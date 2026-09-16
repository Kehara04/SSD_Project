const Notification = require("../models/Notification");
const EmailNotification = require("../models/EmailNotification");
const SmsNotification = require("../models/SmsNotification");

const cleanString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeUserId = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeOutcomes = (outcomes) => {
  if (!Array.isArray(outcomes)) return [];
  return outcomes
    .filter((item) => item && cleanString(item.channel))
    .map((item) => ({
      channel: cleanString(item.channel).toLowerCase(),
      success: Boolean(item.success),
      error: cleanString(item.error),
    }));
};

const getNotificationStatus = (outcomes) => {
  if (!outcomes.length) return "failed";

  const successCount = outcomes.filter((item) => item.success).length;
  if (successCount === 0) return "failed";
  if (successCount === outcomes.length) return "sent";
  return "partial";
};

const normalizeMetadata = (metadata) =>
  metadata && typeof metadata === "object" ? metadata : {};

const saveNotificationLog = async ({
  notificationType,
  recipient = {},
  subject,
  message,
  outcomes = [],
  metadata = {},
}) => {
  const normalizedOutcomes = normalizeOutcomes(outcomes);
  const channelsAttempted = [...new Set(normalizedOutcomes.map((item) => item.channel))];

  return Notification.create({
    notificationType: cleanString(notificationType) || "general",
    recipient: {
      email: cleanString(recipient.email),
      phone: cleanString(recipient.phone),
      role: cleanString(recipient.role).toLowerCase(),
      userId: normalizeUserId(recipient.userId),
    },
    subject: cleanString(subject),
    message: cleanString(message),
    channelsAttempted,
    status: getNotificationStatus(normalizedOutcomes),
    delivery: normalizedOutcomes,
    metadata: normalizeMetadata(metadata),
  });
};

const saveChannelNotificationLogs = async ({
  parentNotificationId,
  notificationType,
  recipient = {},
  subject,
  message,
  emailHtml,
  outcomes = [],
  metadata = {},
}) => {
  const normalizedOutcomes = normalizeOutcomes(outcomes);
  const channelOutcomes = normalizedOutcomes.reduce((acc, item) => {
    acc[item.channel] = item;
    return acc;
  }, {});

  const documentsToCreate = [];
  const cleanEmail = cleanString(recipient.email);
  const cleanPhone = cleanString(recipient.phone);
  const cleanRole = cleanString(recipient.role).toLowerCase();
  const cleanUserId = normalizeUserId(recipient.userId);
  const cleanType = cleanString(notificationType) || "general";
  const cleanSubject = cleanString(subject);
  const cleanMessage = cleanString(message);
  const cleanHtml = cleanString(emailHtml);
  const cleanMetadata = normalizeMetadata(metadata);

  if (channelOutcomes.email && cleanEmail) {
    documentsToCreate.push(
      EmailNotification.create({
        parentNotification: parentNotificationId,
        notificationType: cleanType,
        recipient: {
          email: cleanEmail,
          role: cleanRole,
          userId: cleanUserId,
        },
        subject: cleanSubject,
        message: cleanMessage,
        html: cleanHtml,
        status: channelOutcomes.email.success ? "sent" : "failed",
        error: cleanString(channelOutcomes.email.error),
        metadata: cleanMetadata,
      })
    );
  }

  if (channelOutcomes.sms && cleanPhone) {
    documentsToCreate.push(
      SmsNotification.create({
        parentNotification: parentNotificationId,
        notificationType: cleanType,
        recipient: {
          phone: cleanPhone,
          role: cleanRole,
          userId: cleanUserId,
        },
        message: cleanMessage,
        status: channelOutcomes.sms.success ? "sent" : "failed",
        error: cleanString(channelOutcomes.sms.error),
        metadata: cleanMetadata,
      })
    );
  }

  if (!documentsToCreate.length) return;
  await Promise.all(documentsToCreate);
};

const buildFilters = ({ type, email, phone, userId, role, status, from, to }) => {
  const query = {};

  if (cleanString(type)) query.notificationType = cleanString(type);
  if (cleanString(email)) query["recipient.email"] = cleanString(email).toLowerCase();
  if (cleanString(phone)) query["recipient.phone"] = cleanString(phone);
  if (normalizeUserId(userId) !== undefined) query["recipient.userId"] = normalizeUserId(userId);
  if (cleanString(role)) query["recipient.role"] = cleanString(role).toLowerCase();
  if (cleanString(status)) query.status = cleanString(status).toLowerCase();

  const fromDate = cleanString(from) ? new Date(from) : null;
  const toDate = cleanString(to) ? new Date(to) : null;

  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    query.createdAt = {
      ...(query.createdAt || {}),
      $gte: fromDate,
    };
  }

  if (toDate && !Number.isNaN(toDate.getTime())) {
    query.createdAt = {
      ...(query.createdAt || {}),
      $lte: toDate,
    };
  }

  return query;
};

const listNotificationLogs = async (filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 20, 1), 100);

  const query = buildFilters(filters);

  const [items, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    items,
  };
};

const getNotificationLogById = async (id) => {
  const cleanId = cleanString(id);
  if (!cleanId) return null;

  try {
    return await Notification.findById(cleanId).lean();
  } catch (error) {
    if (error.name === "CastError") return null;
    throw error;
  }
};

const listEmailNotificationLogs = async (filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 20, 1), 100);

  const query = {};
  if (cleanString(filters.type)) query.notificationType = cleanString(filters.type);
  if (cleanString(filters.email)) query["recipient.email"] = cleanString(filters.email).toLowerCase();
  if (normalizeUserId(filters.userId) !== undefined) query["recipient.userId"] = normalizeUserId(filters.userId);
  if (cleanString(filters.role)) query["recipient.role"] = cleanString(filters.role).toLowerCase();
  if (cleanString(filters.status)) query.status = cleanString(filters.status).toLowerCase();

  const [items, total] = await Promise.all([
    EmailNotification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    EmailNotification.countDocuments(query),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    items,
  };
};

const listSmsNotificationLogs = async (filters = {}) => {
  const page = Math.max(Number.parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 20, 1), 100);

  const query = {};
  if (cleanString(filters.type)) query.notificationType = cleanString(filters.type);
  if (cleanString(filters.phone)) query["recipient.phone"] = cleanString(filters.phone);
  if (normalizeUserId(filters.userId) !== undefined) query["recipient.userId"] = normalizeUserId(filters.userId);
  if (cleanString(filters.role)) query["recipient.role"] = cleanString(filters.role).toLowerCase();
  if (cleanString(filters.status)) query.status = cleanString(filters.status).toLowerCase();

  const [items, total] = await Promise.all([
    SmsNotification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    SmsNotification.countDocuments(query),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    items,
  };
};

const getEmailNotificationLogById = async (id) => {
  const cleanId = cleanString(id);
  if (!cleanId) return null;

  try {
    return await EmailNotification.findById(cleanId).lean();
  } catch (error) {
    if (error.name === "CastError") return null;
    throw error;
  }
};

const getSmsNotificationLogById = async (id) => {
  const cleanId = cleanString(id);
  if (!cleanId) return null;

  try {
    return await SmsNotification.findById(cleanId).lean();
  } catch (error) {
    if (error.name === "CastError") return null;
    throw error;
  }
};

module.exports = {
  saveNotificationLog,
  saveChannelNotificationLogs,
  listNotificationLogs,
  getNotificationLogById,
  listEmailNotificationLogs,
  listSmsNotificationLogs,
  getEmailNotificationLogById,
  getSmsNotificationLogById,
};
