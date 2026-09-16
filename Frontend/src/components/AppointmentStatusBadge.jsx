const statusMap = {
  pending: {
    bg: "#fffbeb",
    color: "#92400e",
    label: "Pending",
  },
  approved: {
    bg: "#ecfdf5",
    color: "#065f46",
    label: "Approved",
  },
  rejected: {
    bg: "#fef2f2",
    color: "#991b1b",
    label: "Rejected",
  },
  cancelled: {
    bg: "#f8fafc",
    color: "#475569",
    label: "Cancelled",
  },
  rescheduled: {
    bg: "#eff6ff",
    color: "#1d4ed8",
    label: "Rescheduled",
  },
  completed: {
    bg: "#ecfeff",
    color: "#155e75",
    label: "Completed",
  },
};

const AppointmentStatusBadge = ({ status }) => {
  const styles = statusMap[status] || {
    bg: "var(--brand-50)",
    color: "var(--brand-700)",
    label: status || "Unknown",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.75rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: styles.bg,
        color: styles.color,
        textTransform: "capitalize",
      }}
    >
      {styles.label}
    </span>
  );
};

export default AppointmentStatusBadge;