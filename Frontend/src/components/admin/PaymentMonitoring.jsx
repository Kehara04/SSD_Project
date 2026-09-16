import { useMemo, useState } from "react";

const formatCurrency = (value) => {
  if (typeof value !== "number") return "LKR 0";
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(value);
};

const PaymentMonitoring = ({ payments = [], loading }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPayments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return payments.filter((payment) => {
      const patientName = payment.patientSnapshot?.name || payment.patientName || "";
      const doctorName = payment.doctorSnapshot?.name || payment.doctorName || "";
      const combinedText = `${patientName} ${doctorName}`.toLowerCase();
      return !normalizedSearch || combinedText.includes(normalizedSearch);
    });
  }, [payments, searchTerm]);

  const totalPaid = filteredPayments.filter((payment) => payment.status === "paid").length;
  const totalPending = filteredPayments.filter((payment) => payment.status === "pending").length;
  const totalFailed = filteredPayments.filter((payment) => payment.status === "failed").length;
  const totalRefunded = filteredPayments.filter((payment) => payment.status === "refunded").length;
  const revenue = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--brand-100)",
    boxShadow: "var(--shadow-sm)",
    padding: "1.5rem",
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
        <div style={{ width: "8px", height: "8px", background: "#14b8a6", borderRadius: "50%" }} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 600, color: "var(--brand-800)" }}>
          Payment Monitoring
        </h2>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: "220px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>Search patient or doctor</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type name to filter"
            style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "0.75rem", border: "1px solid var(--brand-100)", background: "#ffffff", color: "var(--text-primary)" }}
          />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total Transactions", value: filteredPayments.length },
          { label: "Paid", value: totalPaid },
          { label: "Pending", value: totalPending },
          { label: "Failed", value: totalFailed },
          { label: "Refunded", value: totalRefunded },
        ].map((metric) => (
          <div key={metric.label} style={{ background: "var(--brand-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--brand-100)", padding: "1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>{metric.label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--brand-700)" }}>{metric.value}</p>
          </div>
        ))}
        <div style={{ background: "var(--brand-50)", borderRadius: "var(--radius-md)", border: "1px solid var(--brand-100)", padding: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>Revenue</p>
          <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f766e" }}>{formatCurrency(revenue)}</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading payments…</p>
      ) : payments.length === 0 ? (
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "1rem" }}>No payment records found in the system.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "720px", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {['Patient', 'Doctor', 'Amount', 'Status', 'Date', 'Time'].map((label) => (
                  <th key={label} style={{ textAlign: "left", padding: "0.85rem 0.75rem", color: "var(--text-secondary)", fontSize: "0.8rem", borderBottom: "1px solid var(--brand-100)" }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.slice(0, 8).map((payment) => (
                <tr key={payment._id || payment.id || payment.stripeSessionId}>
                  <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-primary)" }}>
                    {payment.patientSnapshot?.name || payment.patientName || "Unknown"}
                  </td>
                  <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-primary)" }}>
                    {payment.doctorSnapshot?.name || payment.doctorName || "Unknown"}
                  </td>
                  <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--brand-700)" }}>
                    {formatCurrency(payment.amount || 0)}
                  </td>
                  <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.3rem 0.6rem", borderRadius: "999px", background: payment.status === "paid" ? "#dcfce7" : payment.status === "failed" ? "#fee2e2" : "#fef3c7", color: payment.status === "paid" ? "#166534" : payment.status === "failed" ? "#991b1b" : "#92400e", fontSize: "0.75rem", fontWeight: 600 }}>
                      {payment.status || "pending"}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-secondary)" }}>
                    {(payment.appointmentDate || payment.date || "—").split("T")[0]}
                  </td>
                  <td style={{ padding: "0.85rem 0.75rem", borderBottom: "1px solid var(--brand-100)", color: "var(--text-secondary)" }}>
                    {payment.appointmentTime || payment.time || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentMonitoring;