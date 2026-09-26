
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function GoogleAuthSuccess() {
  const { completeGoogleLogin } = useAuth();

  const navigate = useNavigate();

  const started = useRef(false);

  const [error, setError] = useState("");

  useEffect(() => {
    // Prevent duplicate ticket redemption in React StrictMode.
    if (started.current) {
      return;
    }

    started.current = true;

    // Retrieve the temporary ticket from the URL fragment.
    const ticket = new URLSearchParams(
      window.location.hash.slice(1)
    ).get("ticket");

    // Immediately remove the ticket from the browser URL.
    window.history.replaceState(
      window.history.state,
      "",
      "/auth/google/success"
    );

    if (!ticket) {
      setError(
        "Google sign-in ticket is missing. Please try again."
      );

      return;
    }

    // Exchange the single-use ticket for a MediChannel session.
    completeGoogleLogin(ticket)
      .then((user) => {
        // Google OIDC currently supports patients only.
        if (user.role !== "patient") {
          setError(
            "Google sign-in is currently available for patients only."
          );

          return;
        }

        navigate("/patient", {
          replace: true,
        });
      })
      .catch(() => {
        setError(
          "Google sign-in could not be completed. Please try again."
        );
      });
  }, [completeGoogleLogin, navigate]);

  return (
    <main
      style={{
        padding: "5rem 1rem",
        maxWidth: 520,
        margin: "auto",
        textAlign: "center",
      }}
    >
      <h1>
        {error
          ? "Google sign-in failed"
          : "Completing Google sign-in…"}
      </h1>

      {error && (
        <>
          <p role="alert">
            {error}
          </p>

          <Link to="/login">
            Return to login
          </Link>
        </>
      )}
    </main>
  );
}
