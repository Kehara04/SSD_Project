const express = require("express");
const {
  getDoctorProfilesByUserIdsInternal,
} = require("../controllers/internalController");

const router = express.Router();

router.post("/doctors/profiles/by-user-ids", getDoctorProfilesByUserIdsInternal);

module.exports = router;