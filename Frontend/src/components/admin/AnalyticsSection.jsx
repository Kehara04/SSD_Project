import { useMemo, useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";

const formatCurrency = (value) => {
  if (typeof value !== "number") return "LKR 0";
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(value);
};

const downloadPDF = (data, filename, title, headers) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 20);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  doc.setFillColor(200, 200, 200);
  doc.rect(20, 30, 80, 10, "F");
  doc.rect(100, 30, 80, 10, "F");
  doc.setTextColor(0, 0, 0);
  doc.text(headers[0], 25, 37);
  doc.text(headers[1], 105, 37);
  doc.line(20, 40, 180, 40);

  let y = 50;
  data.forEach((row) => {
    doc.text(row[0], 25, y);
    doc.text(row[1].toString(), 105, y);
    doc.line(20, y + 5, 180, y + 5);
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save(filename);
};

const buildBuckets = (frequency) => {
  const buckets = [];
  const today = new Date();

  if (frequency === "weekly") {
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - index);
      buckets.push({
        key: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        value: 0,
      });
    }
  }

  if (frequency === "monthly") {
    for (let index = 11; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - index);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      buckets.push({
        key: `${date.getFullYear()}-${month}`,
        label: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        value: 0,
      });
    }
  }

  if (frequency === "yearly") {
    for (let index = 4; index >= 0; index -= 1) {
      const year = today.getFullYear() - index;
      buckets.push({
        key: String(year),
        label: String(year),
        value: 0,
      });
    }
  }

  return buckets;
};

const getBucketKey = (dateString, frequency) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  if (frequency === "weekly") return date.toISOString().split("T")[0];
  if (frequency === "monthly") {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${date.getFullYear()}-${month}`;
  }
  if (frequency === "yearly") return String(date.getFullYear());
  return null;
};

let chartJsLoaded = false;
let chartJsLoading = false;
const chartJsCallbacks = [];

function loadChartJs(cb) {
  if (chartJsLoaded) return cb();
  chartJsCallbacks.push(cb);
  if (chartJsLoading) return;
  chartJsLoading = true;
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
  script.onload = () => {
    chartJsLoaded = true;
    chartJsCallbacks.forEach((fn) => fn());
    chartJsCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

const TrendBarChart = ({ data, isCurrency }) => {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    loadChartJs(() => {
      if (!canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const labels = data.map((d) => d.label);
      const values = data.map((d) => d.value);

      chartRef.current = new window.Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: "rgba(180, 230, 220, 0.55)",
              borderColor: "rgba(100, 195, 180, 0.9)",
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
              hoverBackgroundColor: "rgba(100, 195, 180, 0.45)",
              hoverBorderColor: "rgba(60, 170, 155, 1)",
              barPercentage: 0.4,
              categoryPercentage: 0.6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400, easing: "easeInOutQuart" },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#0f4a42",
              titleColor: "#a7f3e4",
              bodyColor: "#d1faf4",
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) =>
                  isCurrency
                    ? formatCurrency(ctx.parsed.y)
                    : `${ctx.parsed.y} appointments`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: "#6b7280",
                font: { size: 12 },
                autoSkip: false,
                maxRotation: 40,
              },
              border: { display: false },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(107, 114, 128, 0.1)",
                drawBorder: false,
              },
              border: { display: false, dash: [4, 4] },
              ticks: {
                color: "#6b7280",
                font: { size: 11 },
                maxTicksLimit: 5,
                callback: (v) =>
                  isCurrency ? `LKR ${Math.round(v / 1000)}k` : v,
              },
            },
          },
        },
      });
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [data, isCurrency]);

  return (
    <div style={{ position: "relative", width: "100%", height: "260px" }}>
      <canvas ref={canvasRef} aria-label="Trend bar chart" />
    </div>
  );
};

const FrequencyToggle = ({ value, onChange }) => (
  <div style={{
    display: "inline-flex",
    background: "var(--brand-50)",
    border: "1px solid var(--brand-100)",
    borderRadius: "999px",
    padding: "3px",
    gap: "2px",
  }}>
    {["weekly", "monthly", "yearly"].map((scope) => (
      <button
        key={scope}
        type="button"
        onClick={() => onChange(scope)}
        style={{
          border: "none",
          borderRadius: "999px",
          padding: "0.3rem 0.9rem",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 600,
          transition: "all 0.15s ease",
          background: value === scope ? "var(--brand-700)" : "transparent",
          color: value === scope ? "#ffffff" : "var(--brand-600)",
          boxShadow: value === scope ? "0 1px 3px rgba(0,0,0,0.15)" : "none",
        }}
      >
        {scope.charAt(0).toUpperCase() + scope.slice(1)}
      </button>
    ))}
  </div>
);

const StatPill = ({ label, value }) => (
  <div style={{
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    background: "var(--brand-50)",
    border: "1px solid var(--brand-100)",
    borderRadius: "var(--radius-md)",
    padding: "0.5rem 1rem",
    minWidth: "80px",
  }}>
    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
    <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--brand-800)", marginTop: "2px" }}>{value}</span>
  </div>
);

const ChartCard = ({ title, description, data, frequency, onFrequencyChange, isCurrency, showDownload }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 1);
  const maxItem = data.find((d) => d.value === max);
  const nonZero = data.filter((d) => d.value > 0).length;

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--brand-100)",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      overflow: "hidden",
    }}>
      {/* Card header */}
      <div style={{
        padding: "1.25rem 1.5rem 1rem",
        borderBottom: "1px solid var(--brand-50)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--brand-900)" }}>{title}</h3>
            <p style={{ margin: "0.2rem 0 0", color: "var(--text-secondary)", fontSize: "0.82rem" }}>{description}</p>
          </div>
          <FrequencyToggle value={frequency} onChange={onFrequencyChange} />
        </div>

        {/* Summary pills */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
          <StatPill label="Total" value={isCurrency ? formatCurrency(total) : total} />
          <StatPill label="Peak" value={isCurrency ? formatCurrency(max) : max} />
          {maxItem && <StatPill label="Best period" value={maxItem.label} />}
          <StatPill label="Active periods" value={`${nonZero} / ${data.length}`} />
        </div>
      </div>

      {/* Chart area */}
      <div style={{ padding: "1rem 1.25rem 0.75rem" }}>
        <TrendBarChart data={data} isCurrency={isCurrency} />
      </div>

      {/* Footer */}
      {showDownload && (
        <div style={{
          padding: "0.75rem 1.5rem",
          borderTop: "1px solid var(--brand-50)",
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <button
            type="button"
            onClick={() => downloadPDF(
              data.map((item) => [item.label, isCurrency ? formatCurrency(item.value) : String(item.value)]),
              `${isCurrency ? "payment" : "appointment"}-trend-${frequency}.pdf`,
              `${title} (${frequency.charAt(0).toUpperCase() + frequency.slice(1)})`,
              ["Period", isCurrency ? "Revenue" : "Appointments"]
            )}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--brand-700)",
              color: "#ffffff",
              border: "none",
              borderRadius: "999px",
              padding: "0.5rem 2.5rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              minWidth: "220px",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              transition: "background 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M8 1v9M5 7l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download PDF Report
          </button>
        </div>
      )}
    </div>
  );
};

const AnalyticsSection = ({ appointments = [], payments = [] }) => {
  const [appointmentFrequency, setAppointmentFrequency] = useState("weekly");
  const [paymentFrequency, setPaymentFrequency] = useState("weekly");

  const appointmentTrend = useMemo(() => {
    const buckets = buildBuckets(appointmentFrequency);
    const bucketMap = new Map(buckets.map((item) => [item.key, item]));
    appointments.forEach((appointment) => {
      const dateString = appointment.appointmentDate || appointment.date || appointment.createdAt || "";
      const key = getBucketKey(dateString, appointmentFrequency);
      if (key && bucketMap.has(key)) bucketMap.get(key).value += 1;
    });
    return Array.from(bucketMap.values());
  }, [appointments, appointmentFrequency]);

  const paymentTrend = useMemo(() => {
    const buckets = buildBuckets(paymentFrequency);
    const bucketMap = new Map(buckets.map((item) => [item.key, item]));
    payments.forEach((payment) => {
      const dateString = payment.appointmentDate || payment.date || payment.createdAt || "";
      const key = getBucketKey(dateString, paymentFrequency);
      if (key && bucketMap.has(key)) bucketMap.get(key).value += Number(payment.amount || 0);
    });
    return Array.from(bucketMap.values());
  }, [payments, paymentFrequency]);

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--brand-100)",
      boxShadow: "var(--shadow-sm)",
      padding: "1.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
        <div style={{ width: "8px", height: "8px", background: "#0ea5e9", borderRadius: "50%" }} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-800)", margin: 0 }}>
          Trend Charts
        </h2>
      </div>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        <ChartCard
          title="Appointment Trend"
          description="Weekly, monthly, and yearly appointment volume from real system data."
          data={appointmentTrend}
          frequency={appointmentFrequency}
          onFrequencyChange={setAppointmentFrequency}
          isCurrency={false}
          showDownload={appointmentFrequency === "monthly" || appointmentFrequency === "yearly"}
        />
        <ChartCard
          title="Payment Revenue"
          description="Real payment totals organized by weekly, monthly, and yearly view."
          data={paymentTrend}
          frequency={paymentFrequency}
          onFrequencyChange={setPaymentFrequency}
          isCurrency={true}
          showDownload={paymentFrequency === "monthly" || paymentFrequency === "yearly"}
        />
      </div>
    </div>
  );
};

export default AnalyticsSection;