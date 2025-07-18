// src/components/SmartTripSuggestion.js
import React, { useEffect, useState } from "react";

function SmartTripSuggestion({ userId }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8080/api/trips/suggestions/${userId}`)
      .then((res) => res.json())
      .then((data) => setSuggestions(data))
      .catch((err) => console.error("Lỗi khi lấy gợi ý:", err));
  }, [userId]);

  return (
    <div>
      <h3>Gợi ý chuyến đi thông minh</h3>
      {suggestions.length === 0 ? (
        <p>Không có gợi ý nào.</p>
      ) : (
        <ul>
          {suggestions.map((trip) => (
            <li key={trip.id}>{trip.origin} → {trip.destination} - {new Date(trip.departureTime).toLocaleString()}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SmartTripSuggestion;
