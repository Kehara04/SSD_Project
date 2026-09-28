const fs = require("fs");

const getInternalSecret = () => {
  const secret = process.env.AUTH_INTERNAL_SECRET_FILE
    ? fs.readFileSync(process.env.AUTH_INTERNAL_SECRET_FILE, "utf8").trim()
    : process.env.AUTH_INTERNAL_SECRET;
  if (typeof secret !== "string" || secret.length < 32 || /REPLACE_ME|YOUR_SECRET/i.test(secret)) {
    throw new Error("A strong AUTH_INTERNAL_SECRET or AUTH_INTERNAL_SECRET_FILE is required");
  }
  return secret;
};

const getInternalServiceHeaders = () => ({ "x-service-secret": getInternalSecret() });

module.exports = { getInternalSecret, getInternalServiceHeaders };
