const StatCard = ({ title, value, helper }) => {
  const safeValue = value ?? "—";
  const valueText = String(safeValue);
  const isLongValue = valueText.length > 15;

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid var(--brand-100)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem 1.25rem",
        borderTop: "3px solid var(--brand-400)",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.18s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
    >
      <p
        style={{
          fontSize: "0.68rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "0.35rem",
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: isLongValue ? "0.9rem" : "1.35rem",
          fontWeight: 700,
          color: "var(--brand-800)",
          lineHeight: 1.2,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {safeValue}
      </p>
      {helper && (
        <p
          style={{
            marginTop: "0.4rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          {helper}
        </p>
      )}
    </div>
  );
};

export default StatCard;
