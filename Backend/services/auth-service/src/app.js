const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");

const authRoutes = require("./routes/authRoutes");

const googleAuthRoutes = require(
  "./routes/googleAuthRoutes"
);

const adminRoutes = require("./routes/adminRoutes");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Existing middleware.
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Trust the reverse proxy when deployed behind HTTPS.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Require a sufficiently long session secret.
if (
  !process.env.OIDC_SESSION_SECRET ||
  process.env.OIDC_SESSION_SECRET.length < 32
) {
  throw new Error(
    "OIDC_SESSION_SECRET must contain at least 32 characters"
  );
}

// Temporary OIDC transaction session.
app.use(
  session({
    name: "medichannel.oidc.sid",

    secret: process.env.OIDC_SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,

      sameSite: "lax",

      secure:
        process.env.NODE_ENV === "production",

      maxAge: 10 * 60 * 1000,
    },
  })
);

// Existing service health endpoint.
app.get("/", (req, res) => {
  res.json({
    message: "Auth Service Running",
  });
});

// Existing authentication routes.
app.use("/api/auth", authRoutes);

// New Google OIDC routes.
app.use(
  "/api/auth/google",
  googleAuthRoutes
);

// Existing admin routes.
app.use("/api/admin", adminRoutes);

// Existing error handling.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
