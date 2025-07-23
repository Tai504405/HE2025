import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Geocoding API
async function geocodePlace(place) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}
async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
function MapClickHandler({ onOriginClick, onDestinationClick, isSelectingOrigin }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      if (isSelectingOrigin) {
        const name = await reverseGeocode(lat, lng);
        onOriginClick(lat, lng, name);
      } else {
        const name = await reverseGeocode(lat, lng);
        onDestinationClick(lat, lng, name);
      }
    },
  });
  return null;
}

function AdminTripForm() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [vehicle, setVehicle] = useState(null);
  const [origin, setOrigin] = useState("");
  const [originLat, setOriginLat] = useState(null);
  const [originLng, setOriginLng] = useState(null);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");

  const stationsFixed = [
    { code: 'U', name: 'Khu U', lat: 10.8098468, lng: 106.7149365 },
    { code: 'AB', name: 'Khu AB', lat: 10.8020141, lng: 106.7147072 },
    { code: 'E', name: 'Khu E', lat: 10.8553228, lng: 106.7855273 },
    { code: 'R', name: 'Khu R', lat: 10.8413359, lng: 106.8086801 }
  ];

  useEffect(() => {
    fetch("http://localhost:8080/api/users?role=driver")
      .then((res) => res.json())
      .then((data) => setDrivers(data))
      .catch(() => setDrivers([]));
  }, []);

  // Khi chọn tài xế, tự động lấy xe của tài xế
  useEffect(() => {
    if (!selectedDriver) { setVehicle(null); return; }
    fetch(`http://localhost:8080/api/vehicles`)
      .then(res => res.json())
      .then(data => {
        const v = data.find(v => v.driver && v.driver.id && v.driver.id.toString() === selectedDriver.toString());
        setVehicle(v || null);
      });
  }, [selectedDriver]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDriver || !origin) {
      setMessage("Vui lòng chọn tài xế và điểm xuất phát!");
      return;
    }
    const station = stationsFixed.find(st => st.code === origin);
    if (!station) {
      setMessage("Điểm xuất phát không hợp lệ!");
      return;
    }
    if (!vehicle) {
      setMessage("Tài xế chưa được gán xe!");
      return;
    }
    try {
      const res = await fetch("http://localhost:8080/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriver,
          vehicleId: vehicle.id,
          origin: station.code,
          destination: station.code,
          originLat: station.lat,
          originLng: station.lng,
          destinationLat: station.lat,
          destinationLng: station.lng,
          notes: note
        })
      });
      if (!res.ok) throw new Error("Không thể tạo chuyến đi");
      setMessage("✅ Đã tạo chuyến đi và gửi thông báo cho tài xế!");
      setOrigin("");
      setSelectedDriver("");
      setVehicle(null);
      setNote("");
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto', padding: '20px' }}>
      <h2>Admin: Tạo chuyến đi cho tài xế</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <label>Chọn tài xế:</label><br />
        <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} required>
          <option value="">-- Chọn tài xế --</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
          ))}
        </select><br /><br />
        <label>Chọn điểm xuất phát:</label><br />
        <select value={origin} onChange={e => setOrigin(e.target.value)} required>
          <option value="">-- Chọn khu --</option>
          {stationsFixed.map(st => (
            <option key={st.code} value={st.code}>{st.name}</option>
          ))}
        </select><br /><br />
        <label>Ghi chú:</label><br />
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú cho chuyến đi..." style={{width:'100%', minHeight:60}} />
        <br /><br />
        <button type="submit">Tạo chuyến đi</button>
        {message && <p>{message}</p>}
      </form>
      {vehicle && (
        <div style={{marginTop:16, color:'#555'}}>
          <b>Xe của tài xế:</b> {vehicle.vehicleCode} - {vehicle.licensePlate} ({vehicle.type})
        </div>
      )}
    </div>
  );
}
export default AdminTripForm; 