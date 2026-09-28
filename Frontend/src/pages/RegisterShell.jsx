import Navbar from "../components/Navbar";
import loginPageBackground from "../assets/hos-bg.png";
import mediChannelLogo from "../assets/mediChannel.png";
import "./Login.css";

const RegisterShell = ({ title, subtitle, children }) => {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-page)" }}>
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
          padding: "3rem clamp(1.25rem, 4vw, 4rem)",
        }}
      >
        <div className="login-animated-text">
          <h2 className="login-animated-title">Welcome to MediChannel</h2>
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
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--brand-100)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            <div>
              <div
                style={{
                  background: "linear-gradient(135deg, var(--brand-500) 0%, var(--brand-700) 100%)",
                  padding: "1.75rem 2rem",
                }}
              >
                <img
                  src={mediChannelLogo}
                  alt="MediChannel logo"
                  style={{
                    height: "46px",
                    width: "auto",
                    maxWidth: "160px",
                    objectFit: "contain",
                    display: "block",
                    marginBottom: "0.95rem",
                  }}
                />
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "#ffffff",
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p
                    style={{
                      marginTop: "0.25rem",
                      fontSize: "0.82rem",
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              <div style={{ padding: "2rem" }}>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterShell;
