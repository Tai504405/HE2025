// src/components/TripList.js
import React, { useEffect, useState } from "react";

const STATUS_ORDER = ["CREATED", "STARTED", "IN_PROGRESS", "FINISHED"];
const STATUS_LABELS = {
  CREATED: "Chờ khởi hành",
  STARTED: "Đã bắt đầu",
  IN_PROGRESS: "Đang di chuyển",
  FINISHED: "Đã kết thúc"
};

function TripList({ userId }) {
  const [trips, setTrips] = useState([]);
  const [message, setMessage] = useState("");

  const fetchTrips = () => {
    fetch(`http://localhost:8080/api/trips/driver/${userId}`)
      .then((res) => res.json())
      .then((data) => setTrips(data))
      .catch((err) => setTrips([]));
  };

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line
  }, [userId]);

  const handleUpdateStatus = async (trip) => {
    const currentIdx = STATUS_ORDER.indexOf(trip.status);
    if (currentIdx === -1 || currentIdx === STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[currentIdx + 1];
    try {
      const res = await fetch(`http://localhost:8080/api/trips/${trip.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextStatus)
      });
      if (!res.ok) throw new Error("Không thể cập nhật trạng thái");
      setMessage("✅ Đã cập nhật trạng thái!");
      fetchTrips();
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h2>Chuyến đi của bạn</h2>
      {message && <p>{message}</p>}
      {trips.length === 0 ? (
        <p>Không có chuyến đi nào.</p>
      ) : (
        <ul>
          {trips.map((trip) => (
            <li key={trip.id} style={{ marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <span><b>Từ {trip.origin} đến {trip.destination}</b></span><br />
              {trip.originLat && trip.originLng && (
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Tọa độ đi: {trip.originLat.toFixed(6)}, {trip.originLng.toFixed(6)}<br />
                </span>
              )}
              {trip.destinationLat && trip.destinationLng && (
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Tọa độ đến: {trip.destinationLat.toFixed(6)}, {trip.destinationLng.toFixed(6)}<br />
                </span>
              )}
              Thời gian khởi hành: {new Date(trip.departureTime).toLocaleString()}<br />
              Số ghế trống: {trip.seatCount}<br />
              Phương tiện: {trip.vehicleId}<br />
              Trạng thái: <b>{STATUS_LABELS[trip.status] || trip.status}</b><br />
              {STATUS_ORDER.indexOf(trip.status) !== -1 && STATUS_ORDER.indexOf(trip.status) < STATUS_ORDER.length - 1 && (
                <button onClick={() => handleUpdateStatus(trip)}>
                  Cập nhật trạng thái: {STATUS_LABELS[STATUS_ORDER[STATUS_ORDER.indexOf(trip.status) + 1]]}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TripList;
