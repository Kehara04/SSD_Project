const crypto = require("node:crypto");

const User = require("../models/User");
const getNextSequence = require("../utils/getNextSequence");
const generateToken = require("../utils/generateToken");

const { googleClient } = require("../config/googleOAuth");

// Short-lived login ticket.
// Development implementation: in-memory storage.
const TICKET_LIFETIME_MS = 60 * 1000;

const tickets = new Map();

// Generate cryptographically secure random values.
const random = () =>
  crypto.randomBytes(32).toString("base64url");

const frontEnd = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";

// Save the temporary OIDC transaction before redirecting to Google.
const saveSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

// Constant-time comparison for state and nonce.
function equalSecret(left, right) {
  if (
    typeof left !== "string" ||
    typeof right !== "string"
  ) {
    return false;
  }

  const a = Buffer.from(left);
  const b = Buffer.from(right);

  return (
    a.length === b.length &&
    crypto.timingSafeEqual(a, b)
  );
}

// Redirect unsuccessful authentication to the login page.
function failureRedirect(res, code) {
  const url = new URL("/login", frontEnd());

  url.searchParams.set("googleError", code);

  res.set("Cache-Control", "no-store");

  return res.redirect(303, url.toString());
}

/*
 * =====================================================
 * STEP 1 — START GOOGLE LOGIN
 * GET /api/auth/google
 * =====================================================
 */

const beginGoogleLogin = async (req, res, next) => {
  try {
    const client = googleClient();

    // Prevent CSRF and authorization response substitution.
    const state = random();

    // Bind the ID token to this login transaction.
    const nonce = random();

    // PKCE protects the authorization code exchange.
    const verifier = random();

    const challenge = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");

    // Temporarily store the transaction in the session.
    req.session.oidc = {
      state,
      nonce,
      verifier,
      createdAt: Date.now(),
    };

    await saveSession(req);

    // Generate the Google authorization URL.
    const url = client.generateAuthUrl({
      response_type: "code",

      scope: [
        "openid",
        "email",
        "profile",
      ],

      state,
      nonce,

      code_challenge: challenge,
      code_challenge_method: "S256",

      prompt: "select_account",
    });

    res.set("Cache-Control", "no-store");

    return res.redirect(url);
  } catch (error) {
    next(error);
  }
};

/*
 * =====================================================
 * STEP 2 — GOOGLE CALLBACK
 * GET /api/auth/google/callback
 * =====================================================
 */

const googleCallback = async (req, res) => {
  const transaction = req.session?.oidc;

  // Make the stored authentication transaction single-use.
  if (req.session) {
    req.session.oidc = null;
  }

  try {
    if (req.session) {
      await saveSession(req);
    }

    // Google authentication was cancelled or rejected.
    if (req.query.error) {
      return failureRedirect(res, "cancelled");
    }

    // Verify the transaction and authorization response.
    if (
      !transaction ||
      Date.now() - transaction.createdAt >
        10 * 60 * 1000 ||
      !equalSecret(
        req.query.state,
        transaction.state
      ) ||
      typeof req.query.code !== "string"
    ) {
      return failureRedirect(res, "invalid_state");
    }

    const client = googleClient();

    // Exchange the authorization code using PKCE.
    const { tokens } = await client.getToken({
      code: req.query.code,
      codeVerifier: transaction.verifier,
    });

    if (!tokens.id_token) {
      return failureRedirect(res, "invalid_identity");
    }

    // Verify Google's signed ID token and its audience.
    const verified = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const claims = verified.getPayload();

    // Validate the issuer, identity, email and nonce.
    if (
      !claims ||
      ![
        "accounts.google.com",
        "https://accounts.google.com",
      ].includes(claims.iss) ||
      !claims.sub ||
      !claims.email ||
      claims.email_verified !== true ||
      !equalSecret(
        claims.nonce,
        transaction.nonce
      )
    ) {
      return failureRedirect(res, "invalid_identity");
    }

    /*
     * Google sub is the stable Google account identifier.
     * Do not identify or link users using email alone.
     */

    let user = await User.findOne({
      googleSub: claims.sub,
    });

    // Create a patient account for a new Google identity.
    if (!user) {
      const email = claims.email.toLowerCase();

      // Prevent automatic linking to an existing local account.
      const existingEmail = await User.exists({
        email,
      });

      if (existingEmail) {
        return failureRedirect(
          res,
          "account_exists"
        );
      }

      try {
        user = await User.create({
          userId: await getNextSequence("userId"),

          name:
            claims.name ||
            email.split("@")[0],

          email,

          googleSub: claims.sub,

          role: "patient",

          doctorVerificationStatus:
            "not_applicable",
        });
      } catch (error) {
        // Handle concurrent creation attempts.
        if (error.code !== 11000) {
          throw error;
        }

        user = await User.findOne({
          googleSub: claims.sub,
        });

        if (!user) {
          return failureRedirect(
            res,
            "account_exists"
          );
        }
      }
    }

    // Google login must not grant doctor or admin access.
    if (
      !user.isActive ||
      user.role !== "patient"
    ) {
      return failureRedirect(
        res,
        "access_denied"
      );
    }

    // Remove expired tickets.
    for (const [key, entry] of tickets) {
      if (entry.expiresAt <= Date.now()) {
        tickets.delete(key);
      }
    }

    // Limit the number of stored tickets.
    if (tickets.size >= 1000) {
      return failureRedirect(
        res,
        "temporarily_unavailable"
      );
    }

    // Create a short-lived, single-use login ticket.
    const ticket = random();

    tickets.set(ticket, {
      userId: String(user._id),
      expiresAt:
        Date.now() + TICKET_LIFETIME_MS,
    });

    // Redirect to React without exposing the MediChannel JWT.
    const url = new URL(
      "/auth/google/success",
      frontEnd()
    );

    // URL fragment is not included in HTTP requests.
    url.hash = new URLSearchParams({
      ticket,
    }).toString();

    res.set({
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    });

    return res.redirect(
      303,
      url.toString()
    );
  } catch (error) {
    console.error(
      "Google OIDC callback failed:",
      error.message
    );

    return failureRedirect(
      res,
      "authentication_failed"
    );
  }
};

/*
 * =====================================================
 * STEP 3 — EXCHANGE LOGIN TICKET
 * POST /api/auth/google/exchange
 * =====================================================
 */

const exchangeGoogleTicket = async (
  req,
  res,
  next
) => {
  try {
    const ticket = req.body?.ticket;

    // Reject malformed tickets.
    if (
      typeof ticket !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(ticket)
    ) {
      return res.status(400).json({
        message: "Invalid login ticket",
      });
    }

    // Delete the ticket before awaiting database operations.
    // It cannot be redeemed a second time.
    const entry = tickets.get(ticket);

    tickets.delete(ticket);

    if (
      !entry ||
      entry.expiresAt <= Date.now()
    ) {
      return res.status(401).json({
        message:
          "Login ticket expired or already used",
      });
    }

    const user = await User.findById(
      entry.userId
    ).select("+googleSub");

    // Verify that this is still an active Google-linked patient.
    if (
      !user ||
      !user.isActive ||
      user.role !== "patient" ||
      !user.googleSub
    ) {
      return res.status(403).json({
        message: "Account unavailable",
      });
    }

    // Generate the existing MediChannel JWT.
    const token = generateToken(user);

    return res.status(200).json({
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

module.exports = {
  beginGoogleLogin,
  googleCallback,
  exchangeGoogleTicket,
};
