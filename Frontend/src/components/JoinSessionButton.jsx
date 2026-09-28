import React from "react";

const JoinSessionButton = ({ onClick }) => {
  return (
    <button
      style={{
        backgroundColor: "#007bff",
        color: "white",
        padding: "10px 20px",
        border: "none",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      Join Consultation
    </button>
  );
};

export default JoinSessionButton;