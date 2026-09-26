const crypto = require("crypto");
const { getInternalSecret } = require("../utils/internalServiceAuth");

const authenticateService = (req, res, next) => {
  let expected;
  try {
    expected = getInternalSecret();
  } catch {
    return res.status(503).json({ message: "Internal service authentication unavailable" });
  }
  const supplied = req.get("x-service-secret");
  if (!supplied) {
    return res.status(401).json({ message: "Unauthorized: Service credential required" });
  }
  const digest = (value) => crypto.createHash("sha256").update(value).digest();
  if (!crypto.timingSafeEqual(digest(supplied), digest(expected))) {
    return res.status(401).json({ message: "Unauthorized: Invalid service credential" });
  }
  return next();
};

module.exports = { authenticateService };
