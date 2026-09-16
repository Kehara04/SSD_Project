import React from "react";

const SessionCard = ({ session, onJoin }) => {
  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", margin: "10px" }}>
      <h3>Consultation Session</h3>
      <p>Status: {session.status}</p>
      <p>Room: {session.roomName}</p>

      <button onClick={onJoin}>Join Now</button>
    </div>
  );
};

export default SessionCard;