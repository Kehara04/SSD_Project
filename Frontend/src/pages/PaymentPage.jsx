import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import { paymentAPI } from "../api/axios";
import CheckoutForm from "../components/CheckoutForm";

// Replace with your actual publishable key or env variable
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_51TEsEuF0ICdELzF1JDA9fbBn6V0lupOcSa3id4C5DUhmmer66Cp6rKYW5AEscvkQhBYjmKchdGCdD2M9VO75oN5U00tI1uXL5B"
);

const PaymentPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const initializePayment = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await paymentAPI.post("/payments/initiate", {
        appointmentId,
      });

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      initializePayment();
    }
  }, [appointmentId]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    }
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Complete Payment"
        subtitle="Securely enter your card details to finalize your appointment."
      />

      <div className="section-card" style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div className="payment-spinner" />
            <p style={{ color: "var(--text-secondary)" }}>Loading secure payment form...</p>
          </div>
        ) : error ? (
          <>
            <div className="alert-error" style={{ marginBottom: "1.5rem" }}>
              {error}
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button className="btn-primary" onClick={initializePayment}>
                Try Again
              </button>
              <button className="btn-secondary" onClick={() => navigate("/patient/appointments")}>
                Go Back
              </button>
            </div>
          </>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm appointmentId={appointmentId} paymentIntentId={paymentIntentId} />
          </Elements>
        ) : (
          <p>Unable to load payment form.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
