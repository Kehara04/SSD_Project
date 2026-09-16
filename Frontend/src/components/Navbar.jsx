// import { useState, useEffect } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import mediChannelLogo from "../assets/mediChannel.png";

// const Navbar = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);

//   // Close menu on route change
//   useEffect(() => {
//     setIsMenuOpen(false);
//   }, [location.pathname]);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   const roleRoute = user?.role === "patient" ? "/patient"
//     : user?.role === "doctor" ? "/doctor"
//       : user?.role === "admin" ? "/admin"
//         : "/";

//   const navLinkStyle = (path) => ({
//     fontSize: "0.875rem",
//     fontWeight: 500,
//     color: location.pathname === path ? "var(--brand-500)" : "var(--gray-600)",
//     textDecoration: "none",
//     padding: "0.3rem 0",
//     borderBottom: location.pathname === path ? "2px solid var(--brand-500)" : "2px solid transparent",
//     transition: "color 0.15s, border-color 0.15s",
//   });

//   const mobileNavLinkStyle = (path) => ({
//     fontSize: "1rem",
//     fontWeight: 500,
//     color: location.pathname === path ? "var(--brand-500)" : "var(--gray-800)",
//     textDecoration: "none",
//     padding: "0.8rem 1rem",
//     borderRadius: "8px",
//     background: location.pathname === path ? "var(--brand-50)" : "transparent",
//     display: "block",
//   });

//   return (
//     <nav
//       style={{
//         background: "rgba(255,255,255,0.96)",
//         backdropFilter: "blur(12px)",
//         borderBottom: "1px solid var(--brand-100)",
//         position: "sticky",
//         top: 0,
//         zIndex: 1000,
//         boxShadow: "0 1px 8px rgba(13,148,136,0.08)",
//       }}
//     >
//       <div
//         className="container-app"
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           height: "64px",
//         }}
//       >
//         {/* Logo */}
//         <Link
//           to="/"
//           style={{
//             textDecoration: "none",
//             display: "flex",
//             alignItems: "center",
//           }}
//         >
//           <img
//             src={mediChannelLogo}
//             alt="MediChannel logo"
//             style={{
//               height: "42px",
//               width: "auto",
//               maxWidth: "190px",
//               objectFit: "contain",
//               display: "block",
//               filter: "drop-shadow(0 1px 4px rgba(6,63,56,0.22))",
//             }}
//           />
//         </Link>

//         {/* Hamburger */}
//         <button
//           className="show-on-mobile"
//           onClick={() => setIsMenuOpen(!isMenuOpen)}
//           style={{
//             background: "none",
//             border: "none",
//             fontSize: "1.5rem",
//             color: "var(--brand-600)",
//             cursor: "pointer",
//             padding: "0.5rem",
//           }}
//         >
//           {isMenuOpen ? "✕" : "☰"}
//         </button>

//         {/* Desktop links */}
//         <div className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
//           <Link to="/" style={navLinkStyle("/")}>
//             Home
//           </Link>

//           <Link to="/doctors" style={navLinkStyle("/doctors")}>
//             Find Doctors
//           </Link>

//           {user ? (
//             <>
//               <Link to={roleRoute} style={navLinkStyle(roleRoute)}>
//                 Dashboard
//               </Link>
//               <button
//                 onClick={handleLogout}
//                 style={{
//                   padding: "0.45rem 1.1rem",
//                   borderRadius: "var(--radius-md)",
//                   border: "1.5px solid var(--brand-200)",
//                   background: "var(--brand-50)",
//                   color: "var(--brand-700)",
//                   fontSize: "0.875rem",
//                   fontWeight: 500,
//                   cursor: "pointer",
//                   transition: "all 0.15s",
//                 }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-100)")}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = "var(--brand-50)")}
//               >
//                 Log out
//               </button>
//             </>
//           ) : (
//             <>
//               <Link to="/login" style={navLinkStyle("/login")}>
//                 Login
//               </Link>
//               <Link
//                 to="/register/patient"
//                 style={{
//                   padding: "0.45rem 1.1rem",
//                   borderRadius: "var(--radius-md)",
//                   background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
//                   color: "#fff",
//                   fontSize: "0.875rem",
//                   fontWeight: 500,
//                   textDecoration: "none",
//                   boxShadow: "0 2px 8px rgba(13,148,136,.25)",
//                   transition: "all 0.18s",
//                 }}
//                 onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
//                 onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
//               >
//                 Get Started
//               </Link>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Mobile Menu Overlay */}
//       {isMenuOpen && (
//         <div
//           className="show-on-mobile"
//           style={{
//             position: "fixed",
//             top: "64px",
//             left: 0,
//             right: 0,
//             bottom: 0,
//             background: "rgba(255,255,255,0.98)",
//             padding: "1.5rem",
//             zIndex: 999,
//             display: "flex",
//             flexDirection: "column",
//             gap: "1rem",
//           }}
//         >
//           <Link to="/" style={mobileNavLinkStyle("/")}>
//             Home
//           </Link>
//           <Link to="/doctors" style={mobileNavLinkStyle("/doctors")}>
//             Find Doctors
//           </Link>
//           {user ? (
//             <>
//               <Link to={roleRoute} style={mobileNavLinkStyle(roleRoute)}>
//                 Dashboard
//               </Link>
//               <button
//                 onClick={handleLogout}
//                 style={{
//                   marginTop: "1rem",
//                   padding: "0.8rem",
//                   borderRadius: "8px",
//                   border: "1px solid var(--brand-200)",
//                   background: "var(--brand-50)",
//                   color: "var(--brand-700)",
//                   fontWeight: 600,
//                   width: "100%",
//                 }}
//               >
//                 Log out
//               </button>
//             </>
//           ) : (
//             <>
//               <Link to="/login" style={mobileNavLinkStyle("/login")}>
//                 Login
//               </Link>
//               <Link
//                 to="/register/patient"
//                 style={{
//                   marginTop: "1rem",
//                   padding: "0.8rem",
//                   borderRadius: "8px",
//                   background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
//                   color: "#fff",
//                   textAlign: "center",
//                   textDecoration: "none",
//                   fontWeight: 600,
//                   width: "100%",
//                 }}
//               >
//                 Get Started
//               </Link>
//             </>
//           )}
//         </div>
//       )}
//     </nav>
//   );
// };

// export default Navbar;

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import mediChannelLogo from "../assets/mediChannel.png";

const Navbar = ({ onMobileMenuToggle, mobileMenuOpen } = {}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const usesExternalMobileMenu = typeof onMobileMenuToggle === "function";
  const isMenuOpenEffective = usesExternalMobileMenu ? Boolean(mobileMenuOpen) : isMenuOpen;

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleRoute = user?.role === "patient" ? "/patient"
    : user?.role === "doctor" ? "/doctor"
      : user?.role === "admin" ? "/admin"
        : "/";

  const navLinkStyle = (path) => ({
    fontSize: "0.875rem",
    fontWeight: 500,
    color: location.pathname === path ? "var(--brand-500)" : "var(--gray-600)",
    textDecoration: "none",
    padding: "0.3rem 0",
    borderBottom: location.pathname === path ? "2px solid var(--brand-500)" : "2px solid transparent",
    transition: "color 0.15s, border-color 0.15s",
  });

  const mobileNavLinkStyle = (path) => ({
    fontSize: "1rem",
    fontWeight: 500,
    color: location.pathname === path ? "var(--brand-500)" : "var(--gray-800)",
    textDecoration: "none",
    padding: "0.8rem 1rem",
    borderRadius: "8px",
    background: location.pathname === path ? "var(--brand-50)" : "transparent",
    display: "block",
  });

  const handleHamburgerClick = () => {
    if (usesExternalMobileMenu) {
      onMobileMenuToggle();
      return;
    }

    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--brand-100)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 1px 8px rgba(13,148,136,0.08)",
      }}
    >
      <div
        className="container-app"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src={mediChannelLogo}
            alt="MediChannel logo"
            style={{
              height: "42px",
              width: "auto",
              maxWidth: "190px",
              objectFit: "contain",
              display: "block",
              filter: "drop-shadow(0 1px 4px rgba(6,63,56,0.22))",
            }}
          />
        </Link>

        {/* Hamburger */}
        <button
          className="show-on-mobile"
          onClick={handleHamburgerClick}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            color: "var(--brand-600)",
            cursor: "pointer",
            padding: "0.5rem",
          }}
        >
          {isMenuOpenEffective ? "✕" : "☰"}
        </button>

        {/* Desktop links */}
        <div className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: "1.75rem" }}>
          <Link to="/" style={navLinkStyle("/")}>
            Home
          </Link>

          <Link to="/doctors" style={navLinkStyle("/doctors")}>
            Find Doctors
          </Link>

          {user ? (
            <>
              <Link to={roleRoute} style={navLinkStyle(roleRoute)}>
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: "0.45rem 1.1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid var(--brand-200)",
                  background: "var(--brand-50)",
                  color: "var(--brand-700)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--brand-100)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--brand-50)")}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={navLinkStyle("/login")}>
                Login
              </Link>
              <Link
                to="/register/patient"
                style={{
                  padding: "0.45rem 1.1rem",
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(13,148,136,.25)",
                  transition: "all 0.18s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {!usesExternalMobileMenu && isMenuOpen && (
        <div
          className="show-on-mobile"
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.98)",
            padding: "1.5rem",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Link to="/" style={mobileNavLinkStyle("/")}>
            Home
          </Link>
          <Link to="/doctors" style={mobileNavLinkStyle("/doctors")}>
            Find Doctors
          </Link>
          {user ? (
            <>
              <Link to={roleRoute} style={mobileNavLinkStyle(roleRoute)}>
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  marginTop: "1rem",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  border: "1px solid var(--brand-200)",
                  background: "var(--brand-50)",
                  color: "var(--brand-700)",
                  fontWeight: 600,
                  width: "100%",
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={mobileNavLinkStyle("/login")}>
                Login
              </Link>
              <Link
                to="/register/patient"
                style={{
                  marginTop: "1rem",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, var(--brand-500), var(--brand-600))",
                  color: "#fff",
                  textAlign: "center",
                  textDecoration: "none",
                  fontWeight: 600,
                  width: "100%",
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
