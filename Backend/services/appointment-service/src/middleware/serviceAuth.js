const authenticateService = (req, res, next) => {
  const incomingSecret = req.headers["x-service-secret"];
  const expectedSecret = process.env.SERVICE_SECRET;

  console.log("incomingSecret:", incomingSecret);
  console.log("expectedSecret:", expectedSecret);

  if (!expectedSecret) {
    return res.status(500).json({
      message: "SERVICE_SECRET is not configured",
    });
  }

  if (!incomingSecret || incomingSecret !== expectedSecret) {
    return res.status(401).json({
      message: "Unauthorized service request",
    });
  }

  next();
};

module.exports = {
  authenticateService,
};