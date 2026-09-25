import { useState } from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import Navbar from "../components/Navbar";

import { useAuth } from "../context/AuthContext";

import loginPageBackground from "../assets/hos-bg.png";

import mediChannelLogo from "../assets/mediChannel.png";

import "./Login.css";

const Login = () => {
  const { login, loading } = useAuth();

  const navigate = useNavigate();

  const [params] = useSearchParams();

  const googleError = params.get("googleError");

  // Friendly error messages for unsuccessful Google login.
  const googleErrors = {
    cancelled:
      "Google sign-in was cancelled.",

    invalid_state:
      "Google sign-in expired. Please try again.",

    invalid_identity:
      "Google identity could not be verified.",

    account_exists:
      "This email already has a MediChannel account. Sign in with your password; account linking is not enabled.",

    access_denied:
      "This account cannot use patient Google sign-in.",

    temporarily_unavailable:
      "Google sign-in is temporarily unavailable.",

    authentication_failed:
      "Google sign-in failed. Please try again.",
  };

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const routeByRole = (role) => {
    if (role === "patient") return "/patient";

    if (role === "doctor") return "/doctor";

    if (role === "admin") return "/admin";

    return "/";
  };

  // Existing email/password login.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const result = await login(
      form.email,
      form.password
    );

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate(
      routeByRole(result.user.role)
    );
  };

  // Start Google OpenID Connect through the backend.
  const handleGoogleLogin = () => {
    const base = (
      import.meta.env.VITE_AUTH_API ||
      "http://localhost:5001/api"
    ).replace(/\/$/, "");

    window.location.assign(
      `${base}/auth/google`
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface-page)",
      }}
    >
      <Navbar />

      <div
        style={{
          minHeight: "calc(100vh - 64px)",

          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",

          position: "relative",

          backgroundImage: `linear-gradient(110deg, rgba(7, 60, 53, 0.46), rgba(7, 60, 53, 0.36)), url(${loginPageBackground})`,

          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",

          padding:
            "3rem clamp(1.25rem, 4vw, 4rem)",
        }}
      >
        <div className="login-animated-text">
          <h2 className="login-animated-title">
            Welcome to MediChannel
          </h2>

          <p className="login-animated-subtitle">
            Your trusted digital channel for modern healthcare.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: "1200px",

            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",

              background: "#ffffff",

              borderRadius:
                "var(--radius-xl)",

              border:
                "1px solid var(--brand-100)",

              boxShadow:
                "var(--shadow-lg)",

              overflow: "hidden",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-600) 0%, var(--brand-800) 100%)",

                padding:
                  "2rem 2rem 1.75rem",
              }}
            >
              <img
                src={mediChannelLogo}
                alt="MediChannel logo"
                style={{
                  height: "48px",
                  width: "auto",
                  maxWidth: "160px",

                  objectFit: "contain",
                  display: "block",

                  marginBottom: "1rem",
                }}
              />

              <h1
                style={{
                  fontFamily:
                    "var(--font-display)",

                  fontSize: "1.6rem",
                  fontWeight: 700,

                  color: "#ffffff",
                }}
              >
                Welcome Back
              </h1>

              <p
                style={{
                  marginTop: "0.35rem",

                  fontSize: "0.875rem",

                  color:
                    "rgba(255,255,255,0.65)",
                }}
              >
                Sign in as patient, doctor, or admin.
              </p>
            </div>

            <div
              style={{
                padding: "2rem",
              }}
            >
              {(error || googleError) && (
                <div
                  className="alert-error"
                  style={{
                    marginBottom: "1.25rem",
                  }}
                >
                  {error ||
                    googleErrors[googleError] ||
                    "Google sign-in failed."}
                </div>
              )}

              {/* Existing email/password login */}

              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",

                  gap: "1rem",
                }}
              >
                <div>
                  <label className="label">
                    Email address
                  </label>

                  <input
                    type="email"
                    name="email"
                    className="input"

                    value={form.email}
                    onChange={handleChange}

                    placeholder="you@example.com"

                    required
                  />
                </div>

                <div>
                  <label className="label">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    className="input"

                    value={form.password}
                    onChange={handleChange}

                    placeholder="********"

                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"

                  style={{
                    width: "100%",

                    marginTop: "0.5rem",

                    padding: "0.7rem",
                  }}

                  disabled={loading}
                >
                  {loading
                    ? "Signing in..."
                    : "Sign In"}
                </button>
              </form>

              {/* Divider */}

              {/* <div
                style={{
                  display: "flex",
                  alignItems: "center",

                  gap: 12,

                  marginTop: 20,
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    flex: 1,

                    borderTop:
                      "1px solid #ddd",
                  }}
                />

                <span
                  style={{
                    color: "#666",
                    fontSize: 12,
                  }}
                >
                  OR
                </span>

                <span
                  style={{
                    flex: 1,

                    borderTop:
                      "1px solid #ddd",
                  }}
                />
              </div> */}

              {/* New Google OIDC login */}

               
{/* Google OpenID Connect Authentication */}
<div className="google-auth-section">

  {/* Section heading */}
  {/* <div className="google-auth-heading">

    <div className="google-auth-icon">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </div>

    <div>
      <h3>A simpler way to sign in</h3>

      <p>
        Access your patient account securely.
      </p>
    </div>

  </div> */}

  {/* Divider */}
  <div className="google-auth-divider">
    <span />
    <p>OR CONTINUE WITH</p>
    <span />
  </div>

  {/* Google login button */}
  <button
    type="button"
    className="google-signin-button"
    onClick={handleGoogleLogin}
    aria-label="Continue with Google as a patient"
  >

    {/* Google logo */}
    <svg
      className="google-logo"
      width="22"
      height="22"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />

      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.87 46.98 24.55z"
      />

      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"
      />

      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>

    <span>Continue with Google</span>

    {/* Arrow */}
    <svg
      className="google-button-arrow"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>

  </button>

  {/* Security information */}
  <div className="google-auth-footer">

    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        width="14"
        height="11"
        x="5"
        y="11"
        rx="2"
      />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>

    <span>
      Secure sign-in for MediChannel patients
    </span>

  </div>

</div>


              {/* Existing registration links */}

              <div
                style={{
                  marginTop: "1.5rem",

                  paddingTop: "1.25rem",

                  borderTop:
                    "1px solid var(--brand-100)",

                  display: "flex",
                  flexDirection: "column",

                  gap: "0.35rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.825rem",

                    color:
                      "var(--text-secondary)",
                  }}
                >
                  New patient?{" "}

                  <Link
                    to="/register/patient"

                    style={{
                      color:
                        "var(--brand-600)",

                      fontWeight: 500,

                      textDecoration: "none",
                    }}
                  >
                    Register here
                  </Link>
                </p>

                <p
                  style={{
                    fontSize: "0.825rem",

                    color:
                      "var(--text-secondary)",
                  }}
                >
                  Doctor?{" "}

                  <Link
                    to="/register/doctor"

                    style={{
                      color:
                        "var(--brand-600)",

                      fontWeight: 500,

                      textDecoration: "none",
                    }}
                  >
                    Register here
                  </Link>
                </p>

                <p
                  style={{
                    fontSize: "0.825rem",

                    color:
                      "var(--text-secondary)",
                  }}
                >
                  Admin?{" "}

                  <Link
                    to="/register/admin"

                    style={{
                      color:
                        "var(--brand-600)",

                      fontWeight: 500,

                      textDecoration: "none",
                    }}
                  >
                    Create admin account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
