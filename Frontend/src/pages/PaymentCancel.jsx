import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  return (
    <DashboardLayout>
      <PageHeader
        title="Payment Cancelled"
        subtitle="Your payment was not completed. No charges have been made."
      />

      <div className="section-card" style={{ textAlign: "center", maxWidth: "520px", margin: "0 auto", padding: "2.5rem" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>❌</div>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.3rem",
          color: "var(--text-primary)",
          marginBottom: "0.5rem",
        }}>
          Payment Not Completed
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "2rem" }}>
          You cancelled the payment or it failed to process. Your appointment is still active — 
          you can try again from your appointments page.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          {appointmentId && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/payment/${appointmentId}`)}
            >
              Try Again
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={() => navigate("/patient/appointments")}
          >
            Back to Appointments
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentCancel;
