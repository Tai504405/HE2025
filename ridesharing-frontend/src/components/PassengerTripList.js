// src/components/PassengerTripList.js
import React, { useEffect, useState, useRef } from 'react';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function PassengerTripList() {
  const user = getUser();
  const [trips, setTrips] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedStation, setSelectedStation] = useState('');
  const [message, setMessage] = useState('');
  const [trackingTrip, setTrackingTrip] = useState(null);
  const [location, setLocation] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetch('/api/trips').then(r => r.json()).then(setTrips);
    fetch(`/api/registrations/user/${user.id}`).then(r => r.json()).then(data => setRegistrations(Array.isArray(data) ? data : []));
    fetch('/api/stations').then(r => r.json()).then(setStations);
  }, [user.id]);

  useEffect(() => {
    // Xóa toàn bộ nội dung div map trước khi khởi tạo lại
    const mapDiv = document.getElementById('user-map');
    if (mapDiv) mapDiv.innerHTML = '';
    if (window.L && mapDiv) {
      mapRef.current = window.L.map('user-map').setView([10.83, 106.76], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // 4 điểm cố định
      const stationsFixed = [
        { code: 'R', name: 'Trường Đại học Công nghệ chi nhánh CNC (Khu R)', lat: 10.8413359, lng: 106.8086801 },
        { code: 'E', name: 'Trường Đại học Hutech - KCN Cao (Khu E)', lat: 10.8553228, lng: 106.7855273 },
        { code: 'AB', name: 'Trường Đại học Công Nghệ Tp,HCM (Khu AB)', lat: 10.8020141, lng: 106.7147072 },
        { code: 'U', name: 'Trường Đại học Công Nghệ Tp,HCM (cơ sở Ung Văn Khiêm) (Khu U)', lat: 10.8098468, lng: 106.7149365 }
      ];

      // Thêm marker
      stationsFixed.forEach(st => {
        window.L.marker([st.lat, st.lng], {
          icon: window.L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            iconSize: [32, 32]
          })
        })
          .addTo(mapRef.current)
          .bindPopup(`<b>${st.code}</b> - ${st.name}`);
      });

      // Vẽ đường đi bộ thực tế bằng OSRM public API (có xử lý lỗi fetch)
      async function getWalkingRoute(from, to) {
        const url = `https://router.project-osrm.org/route/v1/foot/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Network response was not ok');
          const data = await res.json();
          if (!data.routes || !data.routes[0]) throw new Error('No route found');
          return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        } catch (e) {
          console.error('Lỗi lấy route OSRM:', e);
          return [];
        }
      }
      async function drawWalkingRoute() {
        const points = [
          [10.8098468, 106.7149365], // U
          [10.8020141, 106.7147072], // AB
          [10.8553228, 106.7855273], // E
          [10.8413359, 106.8086801], // R
          [10.8098468, 106.7149365]  // Quay lại U
        ];
        let goCoords = [];
        // Đường đi: U -> AB -> E -> R (màu xanh)
        for (let i = 0; i < points.length - 2; i++) {
          const segment = await getWalkingRoute(points[i], points[i+1]);
          goCoords = goCoords.concat(segment);
        }
        if (goCoords.length > 0)
          window.L.polyline(goCoords, { color: 'blue', weight: 5 }).addTo(mapRef.current);
        // Đường về: R -> U (màu đỏ)
        const backSegment = await getWalkingRoute(points[3], points[4]);
        if (backSegment.length > 0)
          window.L.polyline(backSegment, { color: 'red', weight: 5 }).addTo(mapRef.current);
      }
      drawWalkingRoute();
    }
    // Cleanup khi unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleRegister = async () => {
    setMessage('');
    if (!selectedTrip || !selectedStation) {
      setMessage('Vui lòng chọn chuyến và trạm lên xe!');
      return;
    }
    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: { id: user.id },
        trip: { id: selectedTrip },
        station: { id: selectedStation }
      })
    });
    if (!res.ok) {
      setMessage(await res.text());
      return;
    }
    setMessage('Đăng ký thành công!');
    fetch(`/api/registrations/user/${user.id}`).then(r => r.json()).then(data => setRegistrations(Array.isArray(data) ? data : []));
  };

  const handleCancel = async (regId) => {
    await fetch(`/api/registrations/${regId}`, { method: 'DELETE' });
    fetch(`/api/registrations/user/${user.id}`).then(r => r.json()).then(data => setRegistrations(Array.isArray(data) ? data : []));
  };

  const handleTrack = async (tripId) => {
    setTrackingTrip(tripId);
    setLocation(null);
    const res = await fetch(`/api/realtime/trip/${tripId}/location`);
    if (res.ok) setLocation(await res.json());
  };

  return (
    <div className="container mt-4">
      <h2>Đăng ký chuyến xe buýt</h2>
      <div className="row mb-3">
        <div className="col-md-4">
          <label>Chọn chuyến xe:</label>
          <select className="form-control" value={selectedTrip || ''} onChange={e => setSelectedTrip(e.target.value)}>
            <option value="">-- Chọn chuyến --</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.id} - {trip.status} - Số ghế còn: {trip.seatsAvailable}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label>Chọn trạm lên xe:</label>
          <select className="form-control" value={selectedStation || ''} onChange={e => setSelectedStation(e.target.value)}>
            <option value="">-- Chọn trạm --</option>
            {stations.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-success w-100" onClick={handleRegister}>Đăng ký chuyến</button>
        </div>
      </div>
      {message && <div className="alert alert-info">{message}</div>}
      <h3>Các chuyến đã đăng ký</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Mã chuyến</th>
            <th>Trạm lên xe</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {(registrations && Array.isArray(registrations) ? registrations : []).map(reg => (
            <tr key={reg.id}>
              <td>{reg.trip.id}</td>
              <td>{reg.station.name}</td>
              <td>{reg.status}</td>
              <td>
                {reg.status === 'REGISTERED' && <button className="btn btn-danger btn-sm" onClick={() => handleCancel(reg.id)}>Hủy</button>}
                <button className="btn btn-info btn-sm ms-2" onClick={() => handleTrack(reg.trip.id)}>Theo dõi xe</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {trackingTrip && location && (
        <div className="alert alert-success">
          <b>Vị trí xe chuyến {trackingTrip}:</b> Lat: {location.latitude}, Lng: {location.longitude}
        </div>
      )}
      <div className="mt-4">
        <h4>Bản đồ các trạm dừng</h4>
        <div style={{display:'flex',justifyContent:'center'}}>
          <div id="user-map" style={{ height: 400, width: 900, maxWidth:'100%', margin: 'auto' }}></div>
        </div>
      </div>
    </div>
  );
}

export default PassengerTripList;