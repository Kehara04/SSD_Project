const express = require("express");

const {
  beginGoogleLogin,
  googleCallback,
  exchangeGoogleTicket,
} = require("../controllers/googleAuthController");

const router = express.Router();

// Start Google OpenID Connect login.
router.get("/", beginGoogleLogin);

// Receive Google's authorization response.
router.get("/callback", googleCallback);

// Exchange the one-time ticket for a MediChannel JWT.
router.post("/exchange", exchangeGoogleTicket);

module.exports = router;
