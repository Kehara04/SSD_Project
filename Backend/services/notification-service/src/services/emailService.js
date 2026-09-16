const nodemailer = require("nodemailer");

const toBoolean = (value) => String(value).trim().toLowerCase() === "true";

const toPort = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildTransportConfig = () => {
  if (process.env.SMTP_HOST) {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    return {
      host: process.env.SMTP_HOST,
      port: toPort(process.env.SMTP_PORT, 587),
      secure: toBoolean(process.env.SMTP_SECURE),
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    };
  }

  return {
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };
};

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(buildTransportConfig());
  }
  return transporter;
};

const getSenderAddress = () =>
  process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;

const getSenderName = () => process.env.EMAIL_FROM_NAME || "MediChannel";

const getFormattedFrom = (address) => {
  const senderName = getSenderName().replace(/"/g, "");
  return `"${senderName}" <${address}>`;
};

const sendEmail = async (to, subject, text, html) => {
  if (!to) {
    throw new Error("Email recipient is required");
  }

  const from = getSenderAddress();
  if (!from) {
    throw new Error("Email sender is not configured");
  }

  const payload = {
    from: getFormattedFrom(from),
    to,
    subject,
    text,
  };

  if (html) {
    payload.html = html;
  }

  await getTransporter().sendMail(payload);
};

module.exports = { sendEmail };
