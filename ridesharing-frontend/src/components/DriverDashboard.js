import React, { useState, useEffect, useRef } from 'react';
import MapRealtime from "./MapRealtime";
import DriverVehicleInfo from "./DriverVehicleInfo";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
  const [activeTab, setActiveTab] = useState('control');
  const animateRef = useRef();
  const [pendingTrip, setPendingTrip] = useState(null); // chuyến đi mới cần xác nhận
  const [confirmed, setConfirmed] = useState(false);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  // Lấy chuyến đi mới nhất từ trip_plan cho tài xế (chỉ fetch khi mount)
  useEffect(() => {
    if (user && user.id) {
      fetch(`http://localhost:8080/api/trip-plans`)
        .then(res => res.json())
        .then(data => {
          // Lấy chuyến đi chưa xác nhận gần nhất
          const trip = (Array.isArray(data) ? data : []).find(t => t.driver && t.driver.id === user.id && t.status === 'CREATED');
          setPendingTrip(trip || null);
          setConfirmed(trip ? !!trip.driverConfirmed : false);
          // Nếu đã có trip CONFIRMED thì set tripId, confirmed, currentLeg, busPosition
          const confirmedTrip = (Array.isArray(data) ? data : []).find(t => t.driver && t.driver.id === user.id && t.status === 'CONFIRMED');
          if (confirmedTrip) {
            setTripId(confirmedTrip.id);
            setConfirmed(true);
            // Tìm index điểm đi
            const idx = stationsFixed.findIndex(st => st.name === confirmedTrip.origin || st.code === confirmedTrip.origin);
            if (idx !== -1) {
              setCurrentLeg(idx);
              const { lat, lng } = stationsFixed[idx];
              setBusPosition([lat, lng]);
              setBusState('ready');
              setBusStatus('READY');
            }
          }
        });
    }
  }, []); // chỉ chạy khi mount

  // Xác nhận chuyến đi
  const handleConfirmTrip = async () => {
    if (!pendingTrip) return;
    // Lấy thông tin điểm đi trước khi setPendingTrip(null)
    const origin = pendingTrip.origin;
    await fetch(`http://localhost:8080/api/trip-plans/${pendingTrip.id}/confirm`, { method: 'POST' });
    // Refetch lại trip_plan để cập nhật state
    fetch(`http://localhost:8080/api/trip-plans`)
      .then(res => res.json())
      .then(data => {
        const confirmedTrip = (Array.isArray(data) ? data : []).find(
          t => t.driver && t.driver.id === user.id && t.status === 'CONFIRMED'
        );
        if (confirmedTrip) {
          setTripId(confirmedTrip.id);
          setConfirmed(true);
          // Đồng bộ lại vị trí xuất phát
          const idx2 = stationsFixed.findIndex(st => st.name === confirmedTrip.origin || st.code === confirmedTrip.origin);
          if (idx2 !== -1) {
            setCurrentLeg(idx2);
            const { lat, lng } = stationsFixed[idx2];
            setBusPosition([lat, lng]);
            setBusState('ready');
            setBusStatus('READY');
          }
        }
        setPendingTrip(null);
      });
  };
  // Hủy chuyến đi
  const handleCancelTrip = async () => {
    if (!pendingTrip) return;
    await fetch(`http://localhost:8080/api/trip-plans/${pendingTrip.id}/cancel`, { method: 'POST' });
    setConfirmed(false);
    setPendingTrip(null);
  };

  // Xử lý khi driver đóng tab hoặc refresh trang
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      if (user && user.role === 'DRIVER' && tripId) {
        try {
          // Gửi request xóa driver khỏi danh sách realtime trước khi đóng trang
          await fetch(`/api/realtime/trip/${tripId}`, { 
            method: 'DELETE' 
          });
        } catch (error) {
          console.error('Lỗi khi xóa driver:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, tripId]);

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

  // Lắng nghe WebSocket thông báo chuyến đi mới cho tài xế và cập nhật trip_plan khi có thay đổi
  useEffect(() => {
    if (user && user.id) {
      const client = new Client({
        brokerURL: undefined,
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        reconnectDelay: 5000,
      });
      client.onConnect = () => {
        // Lắng nghe notify riêng cho driver
        client.subscribe(`/topic/driver-notify/${user.id}`, (msg) => {
          refetchTripPlan();
        });
        // Lắng nghe admin-realtime để cập nhật khi admin hoặc backend broadcast
        client.subscribe('/topic/admin-realtime', (msg) => {
          refetchTripPlan();
        });
      };
      client.activate();
      return () => client.deactivate();
    }
  }, [user]);

  // Hàm refetch trip_plan cho driver hiện tại
  const refetchTripPlan = () => {
    fetch(`http://localhost:8080/api/trip-plans`)
      .then(res => res.json())
      .then(data => {
        const trip = (Array.isArray(data) ? data : []).find(t => t.driver && t.driver.id === user.id && t.status === 'CREATED');
        setPendingTrip(trip || null);
        setConfirmed(trip ? !!trip.driverConfirmed : false);
        // Nếu đã có trip CONFIRMED thì set tripId, confirmed, currentLeg, busPosition
        const confirmedTrip = (Array.isArray(data) ? data : []).find(t => t.driver && t.driver.id === user.id && t.status === 'CONFIRMED');
        if (confirmedTrip) {
          setTripId(confirmedTrip.id);
          setConfirmed(true);
          // Tìm index điểm đi
          const idx = stationsFixed.findIndex(st => st.name === confirmedTrip.origin || st.code === confirmedTrip.origin);
          if (idx !== -1) {
            setCurrentLeg(idx);
            const { lat, lng } = stationsFixed[idx];
            setBusPosition([lat, lng]);
            setBusState('ready');
            setBusStatus('READY');
          }
        }
      });
  };

  // Gửi vị trí và trạng thái lên backend
  const sendBusLocation = (lat, lng, status, customTripId) => {
    const idToUse = customTripId || tripId;
    if (!idToUse) return;
    fetch(`http://localhost:8080/api/realtime/trip/${idToUse}/location`, {
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

  // Hàm animate icon chạy mượt theo tuyến (route)
  const animateAlongRoute = (leg, tripId) => {
    let i = 0;
    const step = Math.max(1, Math.floor(leg.length / 50)); // 50 bước cho mượt
    if (animateRef.current) clearInterval(animateRef.current);
    animateRef.current = setInterval(() => {
      if (i >= leg.length) {
        clearInterval(animateRef.current);
        setBusPosition(leg[leg.length-1]);
        sendBusLocation(leg[leg.length-1][0], leg[leg.length-1][1], 'ARRIVED', tripId);
        setBusState('arrived');
        setBusStatus('ARRIVED');
        // Có thể tự động chuyển sang leg tiếp theo nếu muốn
        // setCurrentLeg(currentLeg + 1);
        return;
      }
      setBusPosition(leg[i]);
      sendBusLocation(leg[i][0], leg[i][1], 'MOVING', tripId);
      i += step;
    }, 100); // 100ms mỗi bước
  };

  // Khi nhấn 'Đi', animate icon từ vị trí hiện tại đến điểm tiếp theo
  const handleGo = async () => {
    if (!user || !user.id) return;
    // Luôn gọi API tạo trip mới khi nhấn “Đi”
    const res = await fetch(`http://localhost:8080/api/driver/${user.id}/start-trip`, { method: 'POST' });
    if (!res.ok) {
      alert('Không thể tạo chuyến đi mới!');
      return;
    }
    const trip = await res.json();
    console.log('API /start-trip response:', trip);
    const currentTripId = trip.id || trip.tripId;
    setTripId(currentTripId);

    // Gọi API cập nhật origin của trip plan (nếu có tripPlanId tương ứng)
    if (currentLeg !== null && stationsFixed[currentLeg] && user && user.id) {
      const nextLeg = (currentLeg + 1) % stationsFixed.length;
      console.log('Gửi update-origin-by-driver', stationsFixed[nextLeg].code, user.id);
      fetch(`http://localhost:8080/api/trip-plans/update-origin-by-driver/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: stationsFixed[nextLeg].code })
      })
      .then(res => res.text())
      .then(data => console.log('Response update-origin-by-driver:', data));
    }

    if (currentLeg !== null && routePoints[currentLeg]) {
      setBusState('moving');
      setBusStatus('MOVING');
      animateAlongRoute(routePoints[currentLeg], currentTripId);
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
      setCurrentLeg(nextLeg);
    }
    if (nextLeg !== null && nextLeg < routePoints.length) {
      const leg = routePoints[nextLeg];
      const dest = leg[leg.length-1];
      setBusPosition(dest);
      sendBusLocation(dest[0], dest[1], 'ARRIVED');
      // Cập nhật currentLeg để lần sau "Đi tiếp" sẽ đi đến điểm tiếp theo
      if (nextLeg + 1 < routePoints.length) {
        setCurrentLeg(nextLeg + 1);
      } else {
        setCurrentLeg(0); // Quay về U
      }
      // Trigger MapRealtime reload
      setMapRefreshKey(k => k + 1);
    }
  };

  // Khi dừng chân - dừng ngay tại vị trí hiện tại
  const handleStop = () => {
    if (animateRef.current) {
      clearInterval(animateRef.current);
    }
    setBusState('stopped');
    setBusStatus('STOPPED');
    if (busPosition) {
      sendBusLocation(busPosition[0], busPosition[1], 'STOPPED');
    }
  };

  // Khi kết thúc chuyến đi
  const handleEndTrip = () => {
    if (animateRef.current) {
      clearInterval(animateRef.current);
    }
    setTripEnded(true);
    setBusState('ended');
    setBusStatus('ENDED');
    if (busPosition) {
      sendBusLocation(busPosition[0], busPosition[1], 'ENDED');
    }
    if (tripId) {
      fetch(`/api/realtime/trip/${tripId}/end`, { method: 'POST' });
      // Xóa tripId khỏi localStorage
      localStorage.removeItem('currentTripId');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Dashboard Tài xế</h2>
      <h4>Xin chào, {user?.name || "Tài xế"}!</h4>
      
      {/* Navigation tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => setActiveTab('control')}
          >
            Điều khiển xe bus
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'vehicle' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicle')}
          >
            Thông tin phương tiện
          </button>
        </li>
      </ul>

      {/* Control Tab */}
      {activeTab === 'control' && (
        <div>
          {/* Popup xác nhận chuyến đi */}
          {pendingTrip && !confirmed && (
            <div style={{background:'#fffbe6',border:'1px solid #ffe58f',padding:24,borderRadius:8,marginBottom:16}}>
              <h5>Bạn có chuyến đi mới!</h5>
              <div><b>Điểm đi:</b> {pendingTrip.origin}</div>
              <div><b>Xe:</b> {pendingTrip.vehicle?.vehicleCode || ''}</div>
              <button className="btn btn-success me-2" onClick={handleConfirmTrip}>Nhận chuyến</button>
              <button className="btn btn-danger" onClick={handleCancelTrip}>Hủy chuyến</button>
            </div>
          )}
          {/* <MapRealtime currentUserId={user?.id} /> */}
          <MapRealtime currentUserId={user?.id} refreshKey={mapRefreshKey} />
          <div className="mt-4">
            {/* Chỉ hiển thị nút ĐI, ẩn các nút và dropdown khác */}
            <div className="row mb-2">
              <div className="col-md-12 d-flex justify-content-end">
                <button className="btn btn-success me-2" onClick={handleGo} disabled={tripEnded || !confirmed}>ĐI</button>
                <button className="btn btn-danger" onClick={async () => {
                  if (!tripId) return;
                  // Lấy lại thông tin trip_plan hiện tại
                  const res = await fetch(`http://localhost:8080/api/trip-plans/${tripId}`);
                  let trip = null;
                  if (res.ok) {
                    const text = await res.text();
                    if (text) {
                      trip = JSON.parse(text);
                    }
                  }
                  if (!trip) {
                    alert('Không lấy được thông tin chuyến đi!');
                    return;
                  }
                  // Gửi lại toàn bộ thông tin, chỉ đổi status
                  await fetch(`http://localhost:8080/api/trip-plans/${tripId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...trip, status: 'COMPLETED' })
                  });
                  setTripEnded(true);
                }} disabled={tripEnded || !confirmed}>KẾT THÚC CHUYẾN ĐI</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Info Tab */}
      {activeTab === 'vehicle' && (
        <DriverVehicleInfo />
      )}
    </div>
  );
}
export default DriverDashboard; 