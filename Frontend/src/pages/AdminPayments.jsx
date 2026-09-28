import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import PaymentMonitoring from "../components/admin/PaymentMonitoring";
import { paymentAPI } from "../api/axios";

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await paymentAPI.get("/payments/admin/all");
        setPayments(Array.isArray(response.data) ? response.data : response.data.payments || []);
      } catch (err) {
        console.error("Admin payments fetch failed", err.message || err);
        setError(err.response?.data?.message || "Unable to load payment records.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title="Payment Monitoring"
        subtitle="Monitor all payments and transaction summaries for the admin role."
      />
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}
      <PaymentMonitoring payments={payments} loading={loading} />
    </DashboardLayout>
  );
};

export default AdminPayments;
