// import { useState } from "react";
// import DashboardLayout from "../layouts/DashboardLayout";
// import PageHeader from "../components/PageHeader";

// const SymptomChecker = () => {
//   const [symptoms, setSymptoms] = useState("");
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleCheckSymptoms = async (e) => {
//     e.preventDefault();
//     if (!symptoms.trim()) {
//       setError("Please describe your symptoms.");
//       return;
//     }

//     setLoading(true);
//     setError("");
//     setResult(null);

//     try {
//       const response = await fetch("/api/ai/symptoms", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ symptoms }),
//       });

//       const data = await response.json();
//       if (!response.ok) {
//         throw new Error(data.message || "Something went wrong comparing symptoms.");
//       }

//       setResult(data);
//     } catch (err) {
//       setError(err.message || "Failed to reach AI Service. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <DashboardLayout>
//       <PageHeader
//         title="AI Symptom Checker"
//         subtitle="Describe your symptoms below for preliminary suggestions and specialty recommendations."
//       />

//       <div
//         style={{
//           background: "#ffffff",
//           border: "1px solid var(--brand-100)",
//           borderRadius: "var(--radius-lg)",
//           boxShadow: "var(--shadow-md)",
//           maxWidth: "800px",
//           margin: "0 auto",
//         }}
//         className="main-content-padding"
//       >
//         <form onSubmit={handleCheckSymptoms} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
//           <div>
//             <label
//               style={{
//                 display: "block",
//                 marginBottom: "0.5rem",
//                 fontWeight: 600,
//                 color: "var(--brand-800)",
//                 fontSize: "1.05rem"
//               }}
//             >
//               How are you feeling today?
//             </label>
//             <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
//               Please be as detailed as possible (e.g., "I have had a mild headache and steady dry cough for 3 days.")
//             </p>
//             <textarea
//               className="input"
//               rows={5}
//               value={symptoms}
//               onChange={(e) => setSymptoms(e.target.value)}
//               placeholder="Type your symptoms here..."
//               style={{
//                 width: "100%",
//                 resize: "vertical",
//                 fontSize: "1rem",
//                 padding: "1rem",
//                 borderRadius: "var(--radius-md)",
//                 border: "1px solid var(--brand-200)",
//                 outline: "none",
//                 transition: "border-color 0.2s ease",
//               }}
//             />
//           </div>

//           {error && (
//             <div className="alert-error" style={{ fontSize: "0.9rem" }}>
//               {error}
//             </div>
//           )}

//           <div style={{ display: "flex", justifyContent: "flex-end" }}>
//             <button
//               type="submit"
//               className="btn-primary"
//               disabled={loading}
//               style={{
//                 padding: "0.75rem 1.5rem",
//                 fontSize: "1rem",
//                 opacity: loading ? 0.7 : 1,
//                 cursor: loading ? "wait" : "pointer"
//               }}
//             >
//               {loading ? "Analyzing Responses..." : "Analyze Symptoms"}
//             </button>
//           </div>
//         </form>

//         {result && (
//           <div
//             style={{
//               marginTop: "2.5rem",
//               padding: "1.5rem",
//               background: "var(--brand-50)",
//               border: "1px solid var(--brand-200)",
//               borderRadius: "var(--radius-md)",
//               animation: "fadeIn 0.5s ease"
//             }}
//           >
//             <h3 style={{ color: "var(--brand-800)", marginBottom: "1rem", fontSize: "1.2rem" }}>
//               AI Analysis Result
//             </h3>

//             <div style={{ marginBottom: "1rem" }}>
//               <h4 style={{ color: "var(--brand-700)", fontSize: "0.95rem", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
//                 Suggestions
//               </h4>
//               <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
//                 {result.suggestions}
//               </p>
//             </div>

//             <div style={{ marginBottom: "1.5rem" }}>
//               <h4 style={{ color: "var(--brand-700)", fontSize: "0.95rem", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
//                 Recommended Specialty
//               </h4>
//               <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 600 }}>
//                 {result.specialty}
//               </p>
//             </div>

//             <div
//               style={{
//                 padding: "1rem",
//                 background: "#fef2f2",
//                 borderLeft: "4px solid #ef4444",
//                 borderRadius: "var(--radius-sm)",
//               }}
//             >
//               <h4 style={{ color: "#b91c1c", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", textTransform: "uppercase" }}>
//                 Medical Disclaimer
//               </h4>
//               <p style={{ color: "#991b1b", fontSize: "0.8rem", lineHeight: 1.5 }}>
//                 {result.disclaimer || "This AI output is NOT professional medical advice. Please consult a registered doctor immediately for any health concerns."}
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// };

// export default SymptomChecker;

import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";

const SymptomChecker = () => {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckSymptoms = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError("Please describe your symptoms.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:5008/api/ai/symptoms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong comparing symptoms.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to reach AI Service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          margin: "0 auto",
        }}
      >
        <PageHeader
          title="AI Symptom Checker"
          subtitle="Describe your symptoms below for preliminary suggestions and specialty recommendations."
        />

        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--brand-100)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            width: "100%",
            padding: "1.5rem",
          }}
        >
          <form onSubmit={handleCheckSymptoms} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "var(--brand-800)",
                  fontSize: "1.05rem"
                }}
              >
                How are you feeling today?
              </label>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                Please be as detailed as possible (e.g., "I have had a mild headache and steady dry cough for 3 days.")
              </p>
              <textarea
                className="input"
                rows={6}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Type your symptoms here..."
                style={{
                  width: "100%",
                  resize: "vertical",
                  minHeight: "170px",
                  fontSize: "1rem",
                  lineHeight: 1.5,
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--brand-200)",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              />
            </div>

            {error && (
              <div className="alert-error" style={{ fontSize: "0.9rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "wait" : "pointer"
                }}
              >
                {loading ? "Analyzing Responses..." : "Analyze Symptoms"}
              </button>
            </div>
          </form>

          {result && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.25rem",
                background: "var(--brand-50)",
                border: "1px solid var(--brand-200)",
                borderRadius: "var(--radius-md)",
                animation: "fadeIn 0.5s ease"
              }}
            >
              <h3 style={{ color: "var(--brand-800)", marginBottom: "1rem", fontSize: "1.2rem" }}>
                AI Analysis Result
              </h3>

              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ color: "var(--brand-700)", fontSize: "0.95rem", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Suggestions
                </h4>
                <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  {result.suggestions}
                </p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ color: "var(--brand-700)", fontSize: "0.95rem", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Recommended Specialty
                </h4>
                <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 600 }}>
                  {result.specialty}
                </p>
              </div>

              <div
                style={{
                  padding: "1rem",
                  background: "#fef2f2",
                  borderLeft: "4px solid #ef4444",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <h4 style={{ color: "#b91c1c", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem", textTransform: "uppercase" }}>
                  Medical Disclaimer
                </h4>
                <p style={{ color: "#991b1b", fontSize: "0.8rem", lineHeight: 1.5 }}>
                  {result.disclaimer || "This AI output is NOT professional medical advice. Please consult a registered doctor immediately for any health concerns."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SymptomChecker;
