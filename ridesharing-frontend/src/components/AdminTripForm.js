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
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [seatCount, setSeatCount] = useState(1);
  const [message, setMessage] = useState("");
  // Thêm state cho map, vị trí, autocomplete như TripForm
  const [originLat, setOriginLat] = useState(null);
  const [originLng, setOriginLng] = useState(null);
  const [destinationLat, setDestinationLat] = useState(null);
  const [destinationLng, setDestinationLng] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.8231, 106.6297]);
  const [isSelectingOrigin, setIsSelectingOrigin] = useState(true);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const originTimeout = useRef();
  const destinationTimeout = useRef();
  const mapRef = useRef();
  const [routeCoords, setRouteCoords] = useState([]);
  const [myLocation, setMyLocation] = useState(null); // {lat, lng}
  const [watchId, setWatchId] = useState(null);

  // Lấy danh sách tài xế
  useEffect(() => {
    fetch("http://localhost:8080/api/users?role=driver")
      .then((res) => res.json())
      .then((data) => setDrivers(data))
      .catch(() => setDrivers([]));
  }, []);

  // Lấy danh sách xe của tài xế khi chọn
  useEffect(() => {
    if (!selectedDriver) {
      setVehicles([]);
      setVehicleId("");
      return;
    }
    fetch(`http://localhost:8080/api/vehicles/owner/${selectedDriver}`)
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        setVehicleId(data.length > 0 ? data[0].id : "");
      })
      .catch(() => setVehicles([]));
  }, [selectedDriver]);

  // Autocomplete logic (giống TripForm)
  useEffect(() => {
    if (!origin) { setOriginSuggestions([]); return; }
    clearTimeout(originTimeout.current);
    originTimeout.current = setTimeout(async () => {
      const data = await geocodePlace(origin);
      setOriginSuggestions(data);
    }, 400);
  }, [origin]);
  useEffect(() => {
    if (!destination) { setDestinationSuggestions([]); return; }
    clearTimeout(destinationTimeout.current);
    destinationTimeout.current = setTimeout(async () => {
      const data = await geocodePlace(destination);
      setDestinationSuggestions(data);
    }, 400);
  }, [destination]);

  // Fit bounds khi routeCoords thay đổi
  useEffect(() => {
    if (routeCoords.length > 1 && mapRef.current) {
      setTimeout(() => {
        const map = mapRef.current;
        const bounds = L.latLngBounds(routeCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }, 100);
    }
  }, [routeCoords]);

  // Fallback fitBounds cho 2 marker
  useEffect(() => {
    if ((!routeCoords || routeCoords.length <= 1) && originLat && originLng && destinationLat && destinationLng && mapRef.current) {
      setTimeout(() => {
        const map = mapRef.current;
        const bounds = L.latLngBounds([
          [originLat, originLng],
          [destinationLat, destinationLng]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }, 100);
    }
  }, [originLat, originLng, destinationLat, destinationLng]);

  // Lấy route từ OSRM khi đủ 2 điểm
  useEffect(() => {
    async function fetchRoute() {
      if (originLat && originLng && destinationLat && destinationLng) {
        const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destinationLng},${destinationLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          setRouteCoords(data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        } else {
          setRouteCoords([]);
        }
      } else {
        setRouteCoords([]);
      }
    }
    fetchRoute();
  }, [originLat, originLng, destinationLat, destinationLng]);

  // Xử lý click map
  const handleOriginClick = (lat, lng, name) => {
    setOriginLat(lat);
    setOriginLng(lng);
    setOrigin(name);
    setIsSelectingOrigin(false);
    setMapCenter([lat, lng]);
    setOriginSuggestions([]);
    zoomTo(lat, lng);
  };
  const handleDestinationClick = (lat, lng, name) => {
    setDestinationLat(lat);
    setDestinationLng(lng);
    setDestination(name);
    setIsSelectingOrigin(true);
    setMapCenter([lat, lng]);
    setDestinationSuggestions([]);
    zoomTo(lat, lng);
  };
  const handleOriginSearch = async () => {
    if (!origin) return;
    const data = await geocodePlace(origin);
    if (data && data.length > 0) {
      const result = data[0];
      setOriginLat(parseFloat(result.lat));
      setOriginLng(parseFloat(result.lon));
      setOrigin(result.display_name);
      setMapCenter([parseFloat(result.lat), parseFloat(result.lon)]);
      setOriginSuggestions([]);
    } else {
      setMessage("❌ Không tìm thấy địa điểm điểm đi!");
    }
  };
  const handleDestinationSearch = async () => {
    if (!destination) return;
    const data = await geocodePlace(destination);
    if (data && data.length > 0) {
      const result = data[0];
      setDestinationLat(parseFloat(result.lat));
      setDestinationLng(parseFloat(result.lon));
      setDestination(result.display_name);
      setMapCenter([parseFloat(result.lat), parseFloat(result.lon)]);
      setDestinationSuggestions([]);
    } else {
      setMessage("❌ Không tìm thấy địa điểm điểm đến!");
    }
  };
  // Theo dõi vị trí liên tục
  const handleMyLocation = (forOrigin) => {
    if (navigator.geolocation) {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      const id = navigator.geolocation.watchPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });
        const name = await reverseGeocode(latitude, longitude);
        if (forOrigin) {
          setOriginLat(latitude);
          setOriginLng(longitude);
          setOrigin(name);
          setIsSelectingOrigin(false);
          setOriginSuggestions([]);
        } else {
          setDestinationLat(latitude);
          setDestinationLng(longitude);
          setDestination(name);
          setIsSelectingOrigin(true);
          setDestinationSuggestions([]);
        }
        setMapCenter([latitude, longitude]);
      });
      setWatchId(id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          departureTime,
          seatCount,
          userId: selectedDriver,
          vehicleId,
          originLat,
          originLng,
          destinationLat,
          destinationLng
        })
      });
      if (!res.ok) throw new Error("Không thể tạo chuyến đi");
      setMessage("✅ Đã tạo chuyến đi và gửi thông báo cho tài xế!");
      setOrigin("");
      setDestination("");
      setDepartureTime("");
      setSeatCount(1);
      setVehicleId(vehicles.length > 0 ? vehicles[0].id : "");
      setOriginLat(null);
      setOriginLng(null);
      setDestinationLat(null);
      setDestinationLng(null);
      setOriginSuggestions([]);
      setDestinationSuggestions([]);
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };

  const zoomTo = (lat, lng) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <h2>Admin: Tạo chuyến đi cho tài xế</h2>
      {/* Bản đồ */}
      <div style={{ height: '400px', marginBottom: '20px', border: '1px solid #ccc' }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler
            onOriginClick={handleOriginClick}
            onDestinationClick={handleDestinationClick}
            isSelectingOrigin={isSelectingOrigin}
          />
          {originLat && originLng && (
            <Marker position={[originLat, originLng]}>
              <Popup>Điểm đi</Popup>
            </Marker>
          )}
          {destinationLat && destinationLng && (
            <Marker position={[destinationLat, destinationLng]}>
              <Popup>Điểm đến</Popup>
            </Marker>
          )}
          {myLocation && (
            <Circle center={[myLocation.lat, myLocation.lng]} radius={20} pathOptions={{ color: 'red' }}>
              <Popup>Vị trí của tôi (cập nhật realtime)</Popup>
            </Circle>
          )}
          {routeCoords.length > 1 && (
            <Polyline positions={routeCoords} color="blue" />
          )}
        </MapContainer>
      </div>
      <form onSubmit={handleSubmit} autoComplete="off">
        <label>Chọn tài xế:</label><br />
        <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} required>
          <option value="">-- Chọn tài xế --</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
          ))}
        </select><br /><br />
        <label>Chọn phương tiện:</label><br />
        <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required disabled={!selectedDriver || vehicles.length === 0}>
          <option value="">-- Chọn phương tiện --</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.licensePlate} - {v.type} - {v.brand}</option>
          ))}
        </select><br /><br />
        <label>Điểm đi:</label><br />
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Nhập tên địa điểm hoặc click trên bản đồ"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
            autoComplete="off"
          />
          {originSuggestions.length > 0 && (
            <ul style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ccc', width: '100%', maxHeight: 120, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
              {originSuggestions.map((s, idx) => (
                <li key={s.place_id} style={{ padding: 6, cursor: 'pointer' }}
                  onClick={() => {
                    setOriginLat(parseFloat(s.lat));
                    setOriginLng(parseFloat(s.lon));
                    setOrigin(s.display_name);
                    setMapCenter([parseFloat(s.lat), parseFloat(s.lon)]);
                    setOriginSuggestions([]);
                  }}>
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={handleOriginSearch}>Tìm kiếm</button>
        <button type="button" onClick={() => handleMyLocation(true)}>Vị trí của tôi</button>
        <button type="button" onClick={() => setIsSelectingOrigin(true)}>Chọn trên bản đồ</button><br /><br />
        <label>Điểm đến:</label><br />
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Nhập tên địa điểm hoặc click trên bản đồ"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            autoComplete="off"
          />
          {destinationSuggestions.length > 0 && (
            <ul style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ccc', width: '100%', maxHeight: 120, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
              {destinationSuggestions.map((s, idx) => (
                <li key={s.place_id} style={{ padding: 6, cursor: 'pointer' }}
                  onClick={() => {
                    setDestinationLat(parseFloat(s.lat));
                    setDestinationLng(parseFloat(s.lon));
                    setDestination(s.display_name);
                    setMapCenter([parseFloat(s.lat), parseFloat(s.lon)]);
                    setDestinationSuggestions([]);
                  }}>
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={handleDestinationSearch}>Tìm kiếm</button>
        <button type="button" onClick={() => handleMyLocation(false)}>Vị trí của tôi</button>
        <button type="button" onClick={() => setIsSelectingOrigin(false)}>Chọn trên bản đồ</button><br /><br />
        <label>Thời gian khởi hành:</label><br />
        <input type="datetime-local" value={departureTime} onChange={e => setDepartureTime(e.target.value)} required /><br /><br />
        <label>Số ghế trống:</label><br />
        <input type="number" min={1} placeholder="Số ghế trống" value={seatCount} onChange={e => setSeatCount(Number(e.target.value))} required /><br /><br />
        <button type="submit">Tạo chuyến đi</button>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
}

export default AdminTripForm; 