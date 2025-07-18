import React, { useState, useEffect, useRef } from 'react';
import MapRealtime from "./MapRealtime";

const stationsFixed = [
  { code: 'U', name: 'Khu U', lat: 10.8098468, lng: 106.7149365 },
  { code: 'AB', name: 'Khu AB', lat: 10.8020141, lng: 106.7147072 },
  { code: 'E', name: 'Khu E', lat: 10.8553228, lng: 106.7855273 },
  { code: 'R', name: 'Khu R', lat: 10.8413359, lng: 106.8086801 }
];

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function DriverDashboard() {
  const user = getUser();
  const [tripId, setTripId] = useState(null);
  const [busState, setBusState] = useState('idle');
  const [currentLeg, setCurrentLeg] = useState(null);
  const [busPosition, setBusPosition] = useState(null);
  const [busStatus, setBusStatus] = useState('IDLE');
  const [routePoints, setRoutePoints] = useState([]); // polyline các đoạn đường thực tế
  const [tripEnded, setTripEnded] = useState(false);
  const animateRef = useRef();

  // Khi vào dashboard, tạo trip mới cho driver
  useEffect(() => {
    if (user && user.id) {
      fetch('http://localhost:8080/api/driver/trip/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: user.id })
      })
        .then(res => res.json())
        .then(data => setTripId(data.tripId));
    }
  }, [user]);

  // Lấy route thực tế từ OSRM khi load
  useEffect(() => {
    async function fetchRoutes() {
      let allLegs = [];
      // Đảm bảo đủ 4 đoạn: U->AB, AB->E, E->R, R->U
      const points = [
        [10.8098468, 106.7149365], // U
        [10.8020141, 106.7147072], // AB
        [10.8553228, 106.7855273], // E
        [10.8413359, 106.8086801], // R
        [10.8098468, 106.7149365]  // Quay lại U
      ];
      for (let i = 0; i < points.length - 1; i++) {
        const from = { lat: points[i][0], lng: points[i][1] };
        const to = { lat: points[i + 1][0], lng: points[i + 1][1] };
        const url = `http://localhost:5000/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            allLegs.push(coords);
          } else {
            allLegs.push([[from.lat, from.lng], [to.lat, to.lng]]);
          }
        } catch {
          allLegs.push([[from.lat, from.lng], [to.lat, to.lng]]);
        }
      }
      setRoutePoints(allLegs);
    }
    fetchRoutes();
  }, []);

  // Gửi vị trí và trạng thái lên backend
  const sendBusLocation = (lat, lng, status) => {
    if (!tripId) return;
    fetch(`http://localhost:8080/api/realtime/trip/${tripId}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng, status })
    });
  };

  // Khi chọn điểm xuất phát
  const handleReady = (idx) => {
    setCurrentLeg(idx);
    setBusState('ready');
    const { lat, lng } = stationsFixed[idx];
    setBusPosition([lat, lng]);
    setBusStatus('READY');
    sendBusLocation(lat, lng, 'READY');
  };

  // Khi nhấn 'Đi', animate icon từ vị trí hiện tại đến điểm tiếp theo (không reset về U).
  const handleGo = () => {
    setBusState('moving');
    setBusStatus('MOVING');
    let nextLeg = currentLeg;
    // Nếu chưa chọn leg, xác định vị trí hiện tại gần khu nào nhất
    if (nextLeg === null) {
      let minIdx = 0, minDist = 999;
      stationsFixed.forEach((st, idx) => {
        if (busPosition) {
          const d = Math.sqrt((st.lat - busPosition[0]) ** 2 + (st.lng - busPosition[1]) ** 2);
          if (d < minDist) { minDist = d; minIdx = idx; }
        }
      });
      nextLeg = minIdx;
      setCurrentLeg(nextLeg);
    }
    if (nextLeg !== null && nextLeg < routePoints.length) {
      const leg = routePoints[nextLeg];
      let i = 0;
      const step = Math.max(1, Math.floor(leg.length / 50));
      animateRef.current = setInterval(() => {
        if (i >= leg.length) {
          clearInterval(animateRef.current);
          setBusState('arrived');
          setBusPosition(leg[leg.length-1]);
          setBusStatus('ARRIVED');
          sendBusLocation(leg[leg.length-1][0], leg[leg.length-1][1], 'ARRIVED');
          // Nếu đã về lại U (kết thúc 1 vòng), cho phép tiếp tục vòng mới
          if (nextLeg + 1 === routePoints.length) {
            setCurrentLeg(0); // reset về U để tiếp tục vòng mới
            return;
          } else {
            setCurrentLeg(nextLeg + 1);
          }
          return;
        }
        setBusPosition(leg[i]);
        sendBusLocation(leg[i][0], leg[i][1], 'MOVING');
        i += step;
      }, 100);
    }
  };

  // Khi nhấn 'Tới nơi' khi đang di chuyển: icon nhảy thẳng về đích đoạn hiện tại
  const handleArrive = () => {
    if (animateRef.current) clearInterval(animateRef.current);
    setBusState('arrived');
    setBusStatus('ARRIVED');
    let nextLeg = currentLeg;
    if (nextLeg === null) {
      // Nếu chưa chọn leg, xác định vị trí hiện tại gần khu nào nhất
      let minIdx = 0, minDist = 999;
      stationsFixed.forEach((st, idx) => {
        if (busPosition) {
          const d = Math.sqrt((st.lat - busPosition[0]) ** 2 + (st.lng - busPosition[1]) ** 2);
          if (d < minDist) { minDist = d; minIdx = idx; }
        }
      });
      nextLeg = minIdx;
    }
    if (nextLeg !== null && nextLeg < routePoints.length) {
      const leg = routePoints[nextLeg];
      const dest = leg[leg.length-1];
      setBusPosition(dest);
      sendBusLocation(dest[0], dest[1], 'ARRIVED');
    }
  };

  // Khi dừng chân
  const handleStop = () => {
    setBusState('stopped');
    setBusStatus('STOPPED');
    if (busPosition) {
      sendBusLocation(busPosition[0], busPosition[1], 'STOPPED');
    }
  };

  // Khi kết thúc chuyến đi
  const handleEndTrip = () => {
    setTripEnded(true);
    setBusState('stopped');
    setBusStatus('STOPPED');
    if (busPosition) {
      sendBusLocation(busPosition[0], busPosition[1], 'STOPPED');
    }
    if (tripId) {
      fetch(`http://localhost:8080/api/realtime/trip/${tripId}/end`, { method: 'POST' });
    }
  };

  return (
    <div className="container mt-4">
      <h2>Demo điều khiển xe bus</h2>
      <h4>Xin chào, {user?.name || "Tài xế"}!</h4>
      <MapRealtime currentUserId={user?.id} />
      <div className="mt-4">
        <div className="row mb-2">
          <div className="col-md-4">
            <label>Chọn điểm xuất phát:</label>
            <select className="form-control" onChange={e => handleReady(Number(e.target.value))} disabled={tripEnded}>
              <option value="">-- Chọn khu --</option>
              {stationsFixed.map((st, idx) => (
                <option key={st.code} value={idx}>{st.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-8 d-flex align-items-end">
            <button className="btn btn-success me-2" onClick={handleGo} disabled={tripEnded}>Đi</button>
            <button className="btn btn-warning me-2" onClick={handleStop} disabled={tripEnded}>Dừng chân</button>
            <button className="btn btn-primary me-2" onClick={handleArrive} disabled={tripEnded}>Tới nơi</button>
            {busState === 'stopped' && <span className="text-danger">Xe bus đã dừng chân!</span>}
            {!tripEnded && <button className="btn btn-danger ms-2" onClick={handleEndTrip}>Kết thúc chuyến đi</button>}
            {tripEnded && <span className="text-success ms-2">Chuyến đi đã kết thúc!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
export default DriverDashboard; 