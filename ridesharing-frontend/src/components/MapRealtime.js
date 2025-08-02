import React, { useEffect, useRef, useState } from "react";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './MapRealtime.css';

const statusVN = {
  'READY': 'Sẵn sàng',
  'MOVING': 'Đang di chuyển',
  'ARRIVED': 'Đã tới nơi',
  'STOPPED': 'Đã dừng',
  'ENDED': 'Đã kết thúc chuyến đi',
  'IDLE': 'Chưa khởi động'
};

const stationsFixed = [
  { code: 'U', name: 'Khu U', address: 'Trường Đại học Công Nghệ Tp,HCM (cơ sở Ung Văn Khiêm)', lat: 10.8098468, lng: 106.7149365 },
  { code: 'AB', name: 'Khu AB', address: 'Trường Đại học Công Nghệ Tp,HCM', lat: 10.8020141, lng: 106.7147072 },
  { code: 'E', name: 'Khu E', address: 'Trường Đại học Hutech - KCN Cao', lat: 10.8553228, lng: 106.7855273 },
  { code: 'R', name: 'Khu R', address: 'Trường Đại học Công Nghệ chi nhánh CNC', lat: 10.8413359, lng: 106.8086801 }
];

function MapRealtime({ currentUserId, refreshKey }) {
  const mapRef = useRef(null);
  const busMarkersRef = useRef({}); // {tripId: marker}
  const [drivers, setDrivers] = useState([]); // danh sách driver realtime
  const [tripPlans, setTripPlans] = useState([]); // danh sách TripPlan

  // Lấy danh sách TripPlan CONFIRMED (và đồng bộ qua WebSocket notify)
  useEffect(() => {
    const fetchTripPlans = () => {
      fetch('http://localhost:8080/api/trip-plans')
        .then(res => res.json())
        .then(data => setTripPlans(Array.isArray(data) ? data : []));
    };
    fetchTripPlans();
    // WebSocket notify khi có thay đổi trip plan
    const client = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
    });
    client.onConnect = () => {
      client.subscribe('/topic/admin-realtime', (msg) => {
        fetchTripPlans();
      });
    };
    client.activate();
    return () => client.deactivate();
  }, []);

  // Group theo driverId, chỉ giữ trạng thái/tripId mới nhất (lastActive lớn nhất)
  // Lọc bỏ các driver có trạng thái ENDED
  let driverMap = new Map();
  drivers.forEach(d => {
    if (!d.driverId || d.status === 'ENDED') return;
    if (!driverMap.has(d.driverId) || (d.lastActive > driverMap.get(d.driverId).lastActive)) {
      driverMap.set(d.driverId, d);
    }
  });
  let uniqueDrivers = Array.from(driverMap.values());
  if (currentUserId) {
    uniqueDrivers = uniqueDrivers.filter(d => d.driverId === currentUserId || d.driverId === Number(currentUserId));
  }

  // Khởi tạo bản đồ, marker, route
  useEffect(() => {
    const mapDiv = document.getElementById('realtime-map');
    if (mapDiv) mapDiv.innerHTML = '';
    if (window.L && mapDiv) {
      mapRef.current = window.L.map('realtime-map').setView([10.8150, 106.7000], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
      stationsFixed.forEach(st => {
        window.L.marker([st.lat, st.lng], {icon: window.L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', iconSize: [32,32]})})
          .addTo(mapRef.current)
          .bindPopup(`<b>${st.code}</b> - ${st.name}<br/>${st.address}`);
      });
      // Vẽ route thực tế
      async function getDrivingRoute(from, to) {
        const url = `http://localhost:5000/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
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
      async function drawDrivingRoute() {
        const points = [
          [10.8098468, 106.7149365], // U
          [10.8020141, 106.7147072], // AB
          [10.8553228, 106.7855273], // E
          [10.8413359, 106.8086801], // R
          [10.8098468, 106.7149365]  // Quay lại U
        ];
        let goCoords = [];
        for (let i = 0; i < points.length - 1; i++) {
          const segment = await getDrivingRoute(points[i], points[i+1]);
          goCoords = goCoords.concat(segment);
        }
        if (goCoords.length > 0)
          window.L.polyline(goCoords, { color: 'blue', weight: 5 }).addTo(mapRef.current);
      }
      drawDrivingRoute();
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Lắng nghe WebSocket cập nhật danh sách driver
  useEffect(() => {
    const client = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
    });
    client.onConnect = () => {
      client.subscribe('/topic/bus-location', (msg) => {
        // Khi có thông báo (có thể là 'reload'), fetch lại danh sách drivers
        fetch('http://localhost:8080/api/realtime/drivers')
          .then(res => res.json())
          .then(data => setDrivers(Array.isArray(data) ? data : []));
      });
    };
    client.activate();
    return () => client.deactivate();
  }, []);

  // Refetch drivers khi refreshKey thay đổi (trigger từ dashboard)
  useEffect(() => {
    fetch('http://localhost:8080/api/realtime/drivers')
      .then(res => res.json())
      .then(data => setDrivers(Array.isArray(data) ? data : []));
  }, [refreshKey]);

  // Tự động refresh danh sách driver mỗi 5 giây để xóa driver không hoạt động
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetch('/api/realtime/drivers')
  //       .then(res => res.json())
  //       .then(data => setDrivers(Array.isArray(data) ? data : []))
  //       .catch(error => console.error('Lỗi refresh drivers:', error));
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, []);

  // Hiển thị/move icon xe bus cho từng driver
  useEffect(() => {
    if (mapRef.current && window.L) {
      // Xóa marker cũ không còn driver
      Object.keys(busMarkersRef.current).forEach(driverId => {
        if (!uniqueDrivers.find(d => d.driverId === Number(driverId))) {
          busMarkersRef.current[driverId].remove();
          delete busMarkersRef.current[driverId];
        }
      });
      // Thêm/cập nhật marker cho từng driver
      uniqueDrivers.forEach(driver => {
        if (!driver.latitude || !driver.longitude) return;
        // Nếu đã có marker cũ, xóa trước khi tạo mới
        if (busMarkersRef.current[driver.driverId]) {
          busMarkersRef.current[driver.driverId].remove();
          delete busMarkersRef.current[driver.driverId];
        }
        busMarkersRef.current[driver.driverId] = window.L.marker([driver.latitude, driver.longitude], {
          icon: window.L.icon({iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61444.png', iconSize: [40,40]})
        }).addTo(mapRef.current).bindPopup(`${driver.driverName || 'Tài xế'}: ${statusVN[driver.status || 'IDLE']}`);
      });
    }
  }, [uniqueDrivers]);

  // Lọc chỉ giữ mỗi tripId/driverId một bản ghi cuối cùng
  // Nếu có currentUserId, chỉ giữ driver có userId tương ứng
  // Lọc bỏ các driver có trạng thái ENDED hoặc FINISHED
  uniqueDrivers = uniqueDrivers.filter(
    d => d.status !== 'ENDED' && d.status !== 'FINISHED' && d.currentStatus !== 'ENDED' && d.currentStatus !== 'FINISHED'
  );
  if (currentUserId) {
    uniqueDrivers = uniqueDrivers.filter(d => d.driverId === currentUserId || d.driverId === Number(currentUserId));
  }

  // Hàm tìm tên khu gần nhất
  function getNearestStationName(lat, lng) {
    let minDist = 0.001; // ~100m
    let found = null;
    stationsFixed.forEach(st => {
      const d = Math.sqrt((st.lat - lat) ** 2 + (st.lng - lng) ** 2);
      if (d < minDist) {
        minDist = d;
        found = st.name;
      }
    });
    return found;
  }

  return (
    <div className="map-container">
      <div className="driver-list">
        <h5>Danh sách tài xế đang hoạt động:</h5>
        <ul>
          {uniqueDrivers.length === 0 && <li>Không có tài xế nào đang hoạt động.</li>}
          {uniqueDrivers.map(driver => {
            const pos = driver.latitude && driver.longitude ? getNearestStationName(driver.latitude, driver.longitude) : null;
            // Lấy origin từ TripPlan CONFIRMED
            let origin = undefined;
            const plan = tripPlans.find(tp => tp.driver && tp.driver.id === driver.driverId && tp.status === 'CONFIRMED');
            if (plan) origin = plan.origin;
            let statusText = statusVN[driver.status || 'IDLE'];
            if (driver.status === 'MOVING') {
              if (origin) {
                const st = stationsFixed.find(st => st.code === origin);
                statusText = `Đang di chuyển tới ${st ? st.name : origin}`;
              } else {
                statusText = 'Đang di chuyển (không xác định điểm đến)';
              }
            }
            return (
              <li key={driver.tripId}>
                <b>{driver.driverName || 'Tài xế'}:</b> {statusText} {pos ? `(Vị trí: ${pos})` : ''}
              </li>
            );
          })}
        </ul>
      </div>
      <div id="realtime-map" className="map-area"></div>
    </div>
  );
}

export default MapRealtime; 