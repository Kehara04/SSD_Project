import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import { paymentAPI } from "../api/axios";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentIntentId = searchParams.get("payment_intent") || searchParams.get("paymentIntentId") || searchParams.get("session_id");
  const appointmentId = searchParams.get("appointmentId");

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const confirm = async () => {
      if (!paymentIntentId) {
        setError("No transaction ID found. Please check your appointments.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await paymentAPI.get(`/payments/confirm/${paymentIntentId}`);
        setPayment(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to verify payment");
      } finally {
        setLoading(false);
      }
    };

    confirm();
  }, [paymentIntentId]);

  const formatAmount = (amount, currency) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency?.toUpperCase() || "LKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Payment Successful 🎉"
        subtitle="Your consultation fee has been paid. Here is your receipt."
      />

      {loading && (
        <div className="section-card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div className="payment-spinner" />
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
            Confirming your payment...
          </p>
        </div>
      )}

      {error && (
        <div className="section-card">
          <div className="alert-error" style={{ marginBottom: "1rem" }}>{error}</div>
          <button className="btn-secondary" onClick={() => navigate("/patient/appointments")}>
            Back to Appointments
          </button>
        </div>
      )}

      {!loading && payment && (
        <div className="section-card receipt-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          {/* Receipt Header */}
          <div style={{
            background: "linear-gradient(135deg, var(--brand-600), var(--brand-800))",
            borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
            padding: "1.75rem",
            color: "white",
            margin: "-1.5rem -1.5rem 1.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>✅</span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", margin: 0 }}>
                Payment Receipt
              </h2>
            </div>
            <p style={{ opacity: 0.85, fontSize: "0.9rem", margin: 0 }}>
              Transaction confirmed via Stripe
            </p>
          </div>

          {/* Amount */}
          <div style={{
            textAlign: "center",
            padding: "1.25rem 0",
            borderBottom: "1px solid var(--border)",
            marginBottom: "1.25rem",
          }}>
            <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--brand-700)" }}>
              {formatAmount(payment.amount, payment.currency)}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Consultation Fee — Status:{" "}
              <span style={{ color: "var(--success)", fontWeight: 600, textTransform: "capitalize" }}>
                {payment.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="meta-grid" style={{ marginBottom: "1.5rem" }}>
            <div className="meta-item">
              <div className="meta-label">Patient</div>
              <div className="meta-value">{payment.patientSnapshot?.name || "—"}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Doctor</div>
              <div className="meta-value">Dr. {payment.doctorSnapshot?.name || "—"}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Specialization</div>
              <div className="meta-value">{payment.doctorSnapshot?.specialization || "—"}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Appointment Date</div>
              <div className="meta-value">{payment.appointmentDate || "—"}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Appointment Time</div>
              <div className="meta-value">{payment.appointmentTime || "—"}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Transaction Date</div>
              <div className="meta-value">
                {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-LK") : "—"}
              </div>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="soft-panel" style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", wordBreak: "break-all", margin: 0 }}>
              <strong>Transaction ID:</strong> {paymentIntentId}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {payment.receiptUrl && (
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ textDecoration: "none" }}
              >
                View Full Receipt ↗
              </a>
            )}
            <button
              className="btn-secondary"
              onClick={() => navigate("/patient/appointments")}
            >
              Back to Appointments
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PaymentSuccess;
