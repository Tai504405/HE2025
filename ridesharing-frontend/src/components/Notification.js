// src/components/Notification.js
import React from "react";

function Notification({ message }) {
  if (!message) return null;
  return (
    <div style={{ backgroundColor: "#f0f0f0", padding: "10px", margin: "10px 0", border: "1px solid #ccc" }}>
      {message}
    </div>
  );
}

export default Notification;