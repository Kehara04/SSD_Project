const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const getNextSequence = require("../utils/getNextSequence");

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5007";

// =====================================================
// SEND WELCOME NOTIFICATION
// =====================================================

const sendWelcomeNotification = async ({
  email,
  name,
  role,
  userId,
  doctorVerificationStatus,
}) => {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    5000
  );

  try {
    const response = await fetch(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/welcome`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          name,
          role,
          userId,
          doctorVerificationStatus,
        }),

        signal: controller.signal,
      }
    );

    if (!response.ok) {
      let errorMessage = "";

      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message || "";
      } catch {
        errorMessage = "";
      }

      console.error(
        `Welcome notification failed (${response.status})${
          errorMessage ? `: ${errorMessage}` : ""
        }`
      );
    }
  } catch (error) {
    const reason =
      error.name === "AbortError"
        ? "request timeout after 5s"
        : error.message;

    console.error(
      `Welcome notification failed: ${reason}`
    );
  } finally {
    clearTimeout(timeout);
  }
};

// =====================================================
// REGISTER PATIENT
// POST /api/auth/register/patient
// =====================================================

const registerPatient = async (req, res, next) => {
  try {
    const {
      name,
      nic,
      email,
      password,
      phone,
    } = req.body;

    if (!name || !nic || !email || !password) {
      return res.status(400).json({
        message:
          "Name, NIC, email, and password are required",
      });
    }

    const normalizedNic = nic.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const existingNicUser = await User.findOne({
      nic: normalizedNic,
    });

    if (existingNicUser) {
      return res.status(409).json({
        message: "NIC already registered",
      });
    }

    // Hash the patient's password before storing it.
    const hashedPassword = await bcrypt.hash(password, 10);

    const nextUserId = await getNextSequence("userId");

    const user = await User.create({
      userId: nextUserId,
      name,
      nic: normalizedNic,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || "",
      role: "patient",
      doctorVerificationStatus: "not_applicable",
    });

    await sendWelcomeNotification({
      email: user.email,
      name: user.name,
      role: user.role,
      userId: user.userId,
      doctorVerificationStatus:
        user.doctorVerificationStatus,
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: "Patient registered successfully",
      token,

      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        nic: user.nic,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorVerificationStatus:
          user.doctorVerificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// REGISTER DOCTOR
// POST /api/auth/register/doctor
// =====================================================

const registerDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Hash the doctor's password before storing it.
    const hashedPassword = await bcrypt.hash(password, 10);

    const nextUserId = await getNextSequence("userId");

    const user = await User.create({
      userId: nextUserId,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || "",
      role: "doctor",

      // Doctor accounts require administrator approval.
      doctorVerificationStatus: "pending",
    });

    await sendWelcomeNotification({
      email: user.email,
      name: user.name,
      role: user.role,
      userId: user.userId,
      doctorVerificationStatus:
        user.doctorVerificationStatus,
    });

    const token = generateToken(user);

    return res.status(201).json({
      message:
        "Doctor registered successfully. Awaiting admin verification.",
      token,

      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        nic: user.nic || "",
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorVerificationStatus:
          user.doctorVerificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// REGISTER ADMIN
// POST /api/auth/register/admin
//
// VULN-01:
// The route must require authentication and admin role.
// Also verify the requesting admin's CURRENT database status.
//
// PASSWORD FIX:
// Hash the new administrator's password before saving.
// =====================================================

const registerAdmin = async (req, res, next) => {
  try {
    // Re-check the authenticated administrator in MongoDB.
    // Do not rely solely on an older JWT role.
    const requestingAdmin = await User.findById(
      req.user?.id
    );

    if (
      !requestingAdmin ||
      !requestingAdmin.isActive ||
      requestingAdmin.role !== "admin"
    ) {
      return res.status(403).json({
        message:
          "Only active administrators can create admin accounts",
      });
    }

    const {
      name,
      email,
      password,
      phone,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // IMPORTANT: Never store the supplied password directly.
    const hashedPassword = await bcrypt.hash(password, 10);

    const nextUserId = await getNextSequence("userId");

    const user = await User.create({
      userId: nextUserId,
      name,
      email: normalizedEmail,

      // Store the bcrypt hash, not the plaintext password.
      password: hashedPassword,

      phone: phone || "",
      role: "admin",
      doctorVerificationStatus: "not_applicable",
    });

    return res.status(201).json({
      message: "Admin registered successfully",

      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// LOGIN
// POST /api/auth/login
//
// Existing email/password login remains available.
// Google-only patients do not have local passwords.
// =====================================================

const login = async (req, res, next) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Password is select:false in the OIDC-enabled User model.
    // Explicitly select it for local password authentication.
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "User account is deactivated",
      });
    }

    // Google-only patients have no local password.
    // Do not pass undefined to bcrypt.compare().
    if (!user.password) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,

      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        nic: user.nic || "",
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        doctorVerificationStatus:
          user.doctorVerificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET CURRENT USER
// GET /api/auth/me
// =====================================================

const me = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent a deactivated user from retrieving their profile.
    if (!user.isActive) {
      return res.status(403).json({
        message: "User account is deactivated",
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        nic: user.nic || "",
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        doctorVerificationStatus:
          user.doctorVerificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// EXPORTS
// Keep these names aligned with authRoutes.js.
// =====================================================

module.exports = {
  registerPatient,
  registerDoctor,
  registerAdmin,
  login,
  me,
};
