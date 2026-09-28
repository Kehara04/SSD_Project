import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const NotFound = () => {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-page)" }}>
      <Navbar />
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, var(--brand-50) 0%, #e6f7f5 60%, var(--brand-100) 100%)",
          padding: "3rem 1.5rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            background: "#ffffff",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--brand-100)",
            boxShadow: "var(--shadow-lg)",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              background: "linear-gradient(135deg, var(--brand-100), var(--brand-200))",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "2rem",
            }}
          >
            🔍
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "3.5rem",
              fontWeight: 700,
              color: "var(--brand-700)",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
          >
            404
          </h1>
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "var(--brand-800)",
              marginBottom: "0.4rem",
            }}
          >
            Page not found
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "2rem" }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.65rem 1.5rem",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(13,148,136,.28)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
          >
            ← Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;