import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeartRateMonitor from "../components/HeartRateMonitor";
import backgroundImage from "../assets/hos-bg.png";

const Home = () => {
  useEffect(() => {
    const revealItems = document.querySelectorAll(".home-scroll-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const delay = entry.target.getAttribute("data-reveal-delay");
          if (delay) {
            entry.target.style.setProperty("--reveal-delay", delay);
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -60px 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-page)" }}>
      <Navbar />

      {/* ── Hero Section with background image ── */}
      <section
        style={{
          position: "relative",
          minHeight: "88vh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          backgroundImage: `url(${backgroundImage})`,
          // "url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(7,71,63,0.88) 0%, rgba(13,148,136,0.72) 20%, rgba(7,71,63,0.60) 50%)",
          }}
        />

        <div
          className="container-app main-content-responsive"
          style={{ position: "relative", zIndex: 1, padding: "clamp(3rem, 8vh, 5rem) 1.5rem" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "3rem",
              alignItems: "center",
            }}
            className="hero-grid"
          >
            {/* Left: Text */}
            <div className="home-scroll-reveal" style={{ maxWidth: "640px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "rgba(255,255,255,0.15)",
                  color: "#a7f3d0",
                  border: "1px solid rgba(167,243,208,0.35)",
                  borderRadius: "999px",
                  padding: "0.3rem 0.9rem",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  backdropFilter: "blur(8px)",
                }}
              >
                ✦ AI-Enabled Smart Healthcare Platform
              </span>

              <h1
                style={{
                  marginTop: "1.5rem",
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                Your Health,
                <br />
                <span style={{ color: "#5eead4" }}>Expertly Connected.</span>
              </h1>

              <p
                style={{
                  marginTop: "1.25rem",
                  fontSize: "1.05rem",
                  color: "rgba(255,255,255,0.80)",
                  lineHeight: 1.75,
                  maxWidth: "520px",
                }}
              >
                Book verified doctors, manage healthcare profiles, and streamline
                telemedicine workflows — all in one secure, modern platform.
              </p>

              <div
                style={{
                  marginTop: "2.25rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.9rem",
                }}
              >
                <Link
                  to="/register/patient"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.7rem 1.6rem",
                    borderRadius: "var(--radius-md)",
                    background: "#ffffff",
                    color: "var(--brand-700)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                >
                  Register as Patient
                </Link>
                <Link
                  to="/register/doctor"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.7rem 1.6rem",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    backdropFilter: "blur(6px)",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                >
                  Register as Doctor
                </Link>
                <Link
                  to="/doctors"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.7rem 1.6rem",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    backdropFilter: "blur(6px)",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                >
                  Browse Doctors
                </Link>
              </div>
            </div>

            {/* Subtle ECG Animation placed behind text or in empty space */}
            <div
              className="home-scroll-reveal"
              data-reveal-delay="400ms"
              style={{
                position: "absolute",
                top: "50%",
                right: "-10%",
                width: "40%",
                minWidth: "300px",
                transform: "translateY(-50%)",
                opacity: 0.8,
                zIndex: -1,
              }}
            >
              <HeartRateMonitor color="#5eead4" opacity={0.4} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards Section ── */}
      <section
        style={{
          background: "linear-gradient(180deg, #f0faf9 0%, #e6f7f5 100%)",
          padding: "5rem 0",
        }}
      >
        <div className="container-app">
          <div className="home-scroll-reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                fontWeight: 700,
                color: "var(--brand-800)",
              }}
            >
              Everything You Need
            </h2>
            <p
              style={{
                marginTop: "0.75rem",
                color: "var(--text-secondary)",
                fontSize: "1rem",
                maxWidth: "480px",
                margin: "0.75rem auto 0",
              }}
            >
              A complete healthcare management ecosystem for patients, doctors, and administrators.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                icon: "🩺",
                title: "Patient Portal",
                desc: "Register, manage your profile, and browse verified doctors near you.",
                accent: "#0d9488",
                bg: "#edfaf9",
              },
              {
                icon: "👨‍⚕️",
                title: "Doctor Portal",
                desc: "Manage professional details, set consultation fees, and update availability.",
                accent: "#0b7a6e",
                bg: "#e6f7f5",
              },
              {
                icon: "🛡️",
                title: "Admin Controls",
                desc: "Verify doctor registrations, manage users, and maintain platform integrity.",
                accent: "#095f56",
                bg: "#ddf4f2",
              },
              {
                icon: "🚀",
                title: "Ready for Expansion",
                desc: "Extendable to appointments, video sessions, payments, and reports.",
                accent: "#1fa89f",
                bg: "#f0fdfc",
              },
            ].map((f, index) => (
              <div
                key={f.title}
                className="home-scroll-reveal"
                data-reveal-delay={`${index * 110}ms`}
                style={{
                  background: f.bg,
                  border: `1px solid ${f.accent}22`,
                  borderRadius: "var(--radius-lg)",
                  padding: "1.75rem 1.5rem",
                  transition: "all 0.22s ease",
                  cursor: "default",
                  borderLeft: `4px solid ${f.accent}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    fontSize: "2rem",
                    marginBottom: "1rem",
                    width: "52px",
                    height: "52px",
                    background: `${f.accent}18`,
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: f.accent,
                    marginBottom: "0.5rem",
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="home-scroll-reveal"
        style={{
          background: "linear-gradient(180deg, #063f38 0%, #05352f 100%)",
          color: "rgba(255,255,255,0.9)",
          borderTop: "1px solid rgba(255,255,255,0.12)",
          padding: "2rem 1.5rem 1.1rem",
        }}
      >
        <div className="container-app">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
              alignItems: "start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#ccfbf1",
                }}
              >
                MediChannel
              </div>
              <p
                style={{
                  marginTop: "0.45rem",
                  fontSize: "0.84rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.72)",
                  maxWidth: "320px",
                }}
              >
                Trusted digital healthcare platform for patients, doctors, and administrators.
              </p>
            </div>

            <div>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#99f6e4" }}>
                Contact
              </div>
              <p style={{ marginTop: "0.45rem", fontSize: "0.84rem", color: "rgba(255,255,255,0.78)" }}>
                support@medichannel.lk
              </p>
              <p style={{ marginTop: "0.2rem", fontSize: "0.84rem", color: "rgba(255,255,255,0.78)" }}>
                +94 77 123 4567
              </p>
            </div>

            <div>
              <div style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#99f6e4" }}>
                Support Hours
              </div>
              <p style={{ marginTop: "0.45rem", fontSize: "0.84rem", color: "rgba(255,255,255,0.78)" }}>
                Monday - Friday, 8:00 AM - 6:00 PM
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "1.2rem",
              paddingTop: "0.85rem",
              borderTop: "1px solid rgba(255,255,255,0.14)",
              fontSize: "0.76rem",
              color: "rgba(255,255,255,0.62)",
              textAlign: "center",
            }}
          >
            Copyright {new Date().getFullYear()} MediChannel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

