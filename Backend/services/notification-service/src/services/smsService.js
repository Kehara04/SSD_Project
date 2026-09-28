const axios = require("axios");

const TEXTLK_API_URL =
  process.env.TEXTLK_API_URL || "https://app.text.lk/api/v3/sms/send";

const normalizeSriLankanPhone = (phone) => {
  if (!phone) return "";

  let value = String(phone).trim();

  // remove spaces, dashes, brackets
  value = value.replace(/[^\d+]/g, "");

  // +9477xxxxxxx -> 9477xxxxxxx
  if (value.startsWith("+94")) {
    return value.slice(1);
  }

  // 0771234567 -> 94771234567
  if (value.startsWith("0") && value.length === 10) {
    return `94${value.slice(1)}`;
  }

  // 771234567 -> 94771234567
  if (value.length === 9) {
    return `94${value}`;
  }

  // already 9477xxxxxxx
  if (value.startsWith("94")) {
    return value;
  }

  return value;
};

const sendSMS = async (phone, message) => {
  const apiToken = process.env.TEXTLK_API_TOKEN;
  const senderId = process.env.TEXTLK_SENDER_ID;

  if (!phone) {
    throw new Error("SMS recipient phone is required");
  }

  if (!message || !String(message).trim()) {
    throw new Error("SMS message is required");
  }

  if (!apiToken) {
    throw new Error("TEXTLK_API_TOKEN is not configured");
  }

  if (!senderId) {
    throw new Error("TEXTLK_SENDER_ID is not configured");
  }

  const recipient = normalizeSriLankanPhone(phone);

  const payload = {
    recipient,
    sender_id: senderId,
    type: "plain",
    message: String(message).trim(),
  };

  try {
    const response = await axios.post(TEXTLK_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const data = response.data;

    if (!data || data.status !== "success") {
      throw new Error(data?.message || "Text.lk SMS sending failed");
    }

    return data;
  } catch (error) {
    const providerMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    console.error("Text.lk SMS failed:", providerMessage);
    throw new Error(providerMessage);
  }
};

module.exports = { sendSMS };