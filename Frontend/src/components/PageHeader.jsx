const PageHeader = ({ title, subtitle }) => (
  <div
    style={{
      marginBottom: "2rem",
      paddingBottom: "1.5rem",
      borderBottom: "1px solid var(--brand-100)",
    }}
  >
    <h1
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(1.5rem, 3vw, 2rem)",
        fontWeight: 700,
        color: "var(--brand-800)",
        lineHeight: 1.2,
      }}
    >
      {title}
    </h1>
    {subtitle && (
      <p
        style={{
          marginTop: "0.4rem",
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

export default PageHeader;