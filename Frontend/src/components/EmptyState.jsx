const EmptyState = ({ title, description }) => (
  <div
    style={{
      textAlign: "center",
      padding: "3rem 2rem",
      borderRadius: "var(--radius-lg)",
      border: "1.5px dashed var(--brand-200)",
      background: "var(--brand-50)",
    }}
  >
    <div
      style={{
        width: "52px",
        height: "52px",
        background: "var(--brand-100)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 1rem",
        fontSize: "1.5rem",
      }}
    >
      📋
    </div>
    <h3
      style={{
        fontWeight: 600,
        fontSize: "0.95rem",
        color: "var(--brand-700)",
        marginBottom: "0.35rem",
      }}
    >
      {title}
    </h3>
    {description && (
      <p style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
        {description}
      </p>
    )}
  </div>
);

export default EmptyState;