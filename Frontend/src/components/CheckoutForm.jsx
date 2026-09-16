import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";

const CheckoutForm = ({ appointmentId, paymentIntentId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Call stripe.confirmPayment Native
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Redirect to our success page after successful payment
        return_url: `${window.location.origin}/payment/success?appointmentId=${appointmentId}&paymentIntentId=${paymentIntentId}`,
      },
    });

    if (confirmError) {
      // This point is only reached if there's an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`.
      setError(confirmError.message || "An unexpected error occurred.");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid-1">
      <PaymentElement id="payment-element" />
      
      {error && (
        <div className="alert-error" style={{ marginTop: "1rem" }}>
          {error}
        </div>
      )}

      <button disabled={isProcessing || !stripe || !elements} className="btn-primary" style={{ width: "100%", marginTop: "1.5rem" }}>
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </form>
  );
};

export default CheckoutForm;
