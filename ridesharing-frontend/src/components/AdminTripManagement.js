import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TripRegistrationDetail from './TripRegistrationDetail';
import './AdminTripManagement.css';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const AdminTripManagement = () => {
    const [trips, setTrips] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Filters
    const [filters, setFilters] = useState({
        date: '',
        origin: '',
        driverId: '',
        vehicleId: '',
        status: ''
    });

    // Form states
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [formData, setFormData] = useState({
        driverId: '',
        notes: ''
    });

    // Report states
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [reportFilters, setReportFilters] = useState({
        startDate: '',
        endDate: '',
        driverId: ''
    });

    // Registration detail states
    const [showRegistrationDetail, setShowRegistrationDetail] = useState(false);
    const [selectedTripForRegistration, setSelectedTripForRegistration] = useState(null);

    // Thêm state cho điểm xuất phát và xe tự động
    const [origin, setOrigin] = useState("");
    const [vehicle, setVehicle] = useState(null);

    // Thêm state cho vị trí realtime
    const [driverLocations, setDriverLocations] = useState({});

    // Load dữ liệu lần đầu
    useEffect(() => {
        loadData(true);
    }, []);

    // Auto refresh dữ liệu mỗi 1 giây (không hiển thị loading)
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         loadData(false); // Không hiển thị loading khi auto refresh
    //         loadTrips(false); // Không hiển thị loading khi auto refresh
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, [filters]);

    // Load trips khi filters thay đổi (thao tác thủ công)
    useEffect(() => {
        loadTrips(true);
    }, [filters]);

    // Khi chọn tài xế, tự động lấy xe của tài xế
    useEffect(() => {
        if (!formData.driverId) { setVehicle(null); return; }
        axios.get('http://localhost:8080/api/vehicles')
            .then(res => {
                const v = res.data.find(v => v.driver && v.driver.id && v.driver.id.toString() === formData.driverId.toString());
                setVehicle(v || null);
            });
    }, [formData.driverId]);

    // Lấy vị trí realtime của tài xế
    const fetchLocations = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/realtime/drivers');
            // Map theo driverId
            const locs = {};
            (Array.isArray(res.data) ? res.data : []).forEach(d => {
                if (d.driverId) locs[d.driverId] = d;
            });
            setDriverLocations(locs);
        } catch {}
    };

    useEffect(() => {
        fetchLocations();
        const interval = setInterval(fetchLocations, 5000);
        return () => clearInterval(interval);
    }, []);

    // WebSocket realtime cho admin
    useEffect(() => {
        const client = new Client({
            brokerURL: undefined,
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            reconnectDelay: 5000,
        });
        client.onConnect = () => {
            client.subscribe('/topic/admin-realtime', (msg) => {
                loadTrips();
                // Cập nhật vị trí tài xế ngay lập tức
                if (typeof fetchLocations === 'function') fetchLocations();
            });
        };
        client.activate();
        return () => client.deactivate();
    }, []);

    const loadData = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            
            // Load drivers
            const driversResponse = await axios.get('http://localhost:8080/api/users?role=DRIVER');
            setDrivers(driversResponse.data);

            // Load vehicles
            const vehiclesResponse = await axios.get('http://localhost:8080/api/vehicles');
            setVehicles(vehiclesResponse.data);

            // Load schedules
            const schedulesResponse = await axios.get('http://localhost:8080/api/bus-schedules');
            setSchedules(schedulesResponse.data);

        } catch (error) {
            setError('Lỗi tải dữ liệu: ' + error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Lấy danh sách chuyến đi từ trip_plan
    const loadTrips = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const response = await axios.get('http://localhost:8080/api/trip-plans');
            setTrips(response.data);
        } catch (error) {
            setError('Lỗi tải danh sách chuyến đi: ' + error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Tạo chuyến đi mới vào trip_plan
    const handleCreateTrip = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const station = stationsFixed.find(st => st.code === origin);
            if (!formData.driverId || !station) {
                setError('Vui lòng chọn tài xế và điểm xuất phát!');
                setLoading(false);
                return;
            }
            if (!vehicle) {
                setError('Tài xế chưa được gán xe!');
                setLoading(false);
                return;
            }
            await axios.post('http://localhost:8080/api/trip-plans', {
                driver: { id: formData.driverId },
                vehicle: { id: vehicle.id },
                origin: station.code,
                destination: station.code,
                originLat: station.lat,
                originLng: station.lng,
                destinationLat: station.lat,
                destinationLng: station.lng,
                notes: formData.notes,
                status: 'CREATED'
            });
            setSuccess('Tạo chuyến đi thành công!');
            setShowCreateForm(false);
            setFormData({ driverId: '', notes: '' });
            setOrigin("");
            setVehicle(null);
            loadTrips(true);
        } catch (error) {
            setError('Lỗi tạo chuyến đi: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Cập nhật chuyến đi
    const handleUpdateTrip = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Lấy thông tin vehicle hiện tại của tài xế (nếu có)
            let vehicleObj = vehicle;
            if (!vehicleObj && formData.driverId) {
                vehicleObj = vehicles.find(v => v.driver && v.driver.id.toString() === formData.driverId.toString());
            }
            // Lấy thông tin station (origin)
            const station = stationsFixed.find(st => st.code === origin);
            // Gửi đầy đủ thông tin như khi tạo
            await axios.put(`http://localhost:8080/api/trip-plans/${selectedTrip.id}`, {
                id: selectedTrip.id,
                driver: { id: formData.driverId },
                vehicle: vehicleObj ? { id: vehicleObj.id } : null,
                origin: station ? station.code : selectedTrip.origin,
                destination: station ? station.code : selectedTrip.destination,
                originLat: station ? station.lat : selectedTrip.originLat,
                originLng: station ? station.lng : selectedTrip.originLng,
                destinationLat: station ? station.lat : selectedTrip.destinationLat,
                destinationLng: station ? station.lng : selectedTrip.destinationLng,
                notes: formData.notes,
                status: selectedTrip.status,
                startedAt: selectedTrip.startedAt,
                endedAt: selectedTrip.endedAt,
                driverConfirmed: selectedTrip.driverConfirmed
            });
            setSuccess('Cập nhật chuyến đi thành công!');
            setShowEditForm(false);
            setSelectedTrip(null);
            setFormData({ driverId: '', notes: '' });
            loadTrips(true);
        } catch (error) {
            setError('Lỗi cập nhật chuyến đi: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    // Xóa chuyến đi
    const handleDeleteTrip = async (tripId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa chuyến đi này?')) {
            return;
        }
        try {
            setLoading(true);
            await axios.delete(`http://localhost:8080/api/trip-plans/${tripId}`);
            setSuccess('Xóa chuyến đi thành công!');
            loadTrips(true);
        } catch (error) {
            setError('Lỗi xóa chuyến đi: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAssignVehicle = async (tripId, vehicleId) => {
        try {
            setLoading(true);
            await axios.put(`http://localhost:8080/api/admin/trips/${tripId}/vehicle`, { vehicleId });
            setSuccess('Gán xe thành công!');
            loadTrips(true);
        } catch (error) {
            setError('Lỗi gán xe: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleAssignDriver = async (tripId, driverId) => {
        try {
            setLoading(true);
            await axios.put(`http://localhost:8080/api/admin/trips/${tripId}/driver`, { driverId });
            setSuccess('Gán tài xế thành công!');
            loadTrips(true);
        } catch (error) {
            setError('Lỗi gán tài xế: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRegistrationLock = async (tripId, lock) => {
        try {
            setLoading(true);
            await axios.put(`http://localhost:8080/api/admin/trips/${tripId}/lock-registration`, { lock });
            setSuccess(lock ? 'Khóa đăng ký thành công!' : 'Mở khóa đăng ký thành công!');
            loadTrips(true);
        } catch (error) {
            setError('Lỗi thay đổi trạng thái khóa: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    const generateReport = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            Object.keys(reportFilters).forEach(key => {
                if (reportFilters[key]) {
                    params.append(key, reportFilters[key]);
                }
            });

            const response = await axios.get(`http://localhost:8080/api/admin/trips/report?${params}`);
            setReportData(response.data);
            setShowReport(true);
        } catch (error) {
            setError('Lỗi tạo báo cáo: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        // Tạo CSV content
        const headers = ['ID Chuyến', 'Tài xế', 'Mã xe', 'Thời gian bắt đầu', 'Thời gian kết thúc', 'Trạng thái', 'Tổng ghế', 'Ghế trống', 'Số đăng ký', 'Tỷ lệ lấp đầy (%)'];
        const csvContent = [
            headers.join(','),
            ...reportData.map(row => [
                row.tripId,
                row.driverName,
                row.vehicleCode,
                row.startTime,
                row.endTime,
                row.status,
                row.totalSeats,
                row.availableSeats,
                row.registeredCount,
                row.occupancyRate.toFixed(2)
            ].join(','))
        ].join('\n');

        // Tạo và download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bao_cao_chuyen_di_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status) => {
        const statusMap = {
            'CREATED': '#6c757d',
            'WAITING': '#ffc107',
            'BOARDING': '#17a2b8',
            'RUNNING': '#28a745',
            'COMPLETED': '#6c757d',
            'CANCELLED': '#dc3545',
            'FINISHED': '#6c757d'
        };
        return statusMap[status] || '#6c757d';
    };

    const getStatusText = (status) => {
        const statusMap = {
            'CREATED': 'Đã tạo',
            'WAITING': 'Chờ khởi hành',
            'BOARDING': 'Đang lên xe',
            'RUNNING': 'Đang chạy',
            'COMPLETED': 'Hoàn thành',
            'CANCELLED': 'Đã hủy',
            'FINISHED': 'Đã kết thúc'
        };
        return statusMap[status] || status;
    };

    // Thêm danh sách khu cố định và hàm tìm tên khu gần nhất
    const stationsFixed = [
        { code: 'U', name: 'Khu U', lat: 10.8098468, lng: 106.7149365 },
        { code: 'AB', name: 'Khu AB', lat: 10.8020141, lng: 106.7147072 },
        { code: 'E', name: 'Khu E', lat: 10.8553228, lng: 106.7855273 },
        { code: 'R', name: 'Khu R', lat: 10.8413359, lng: 106.8086801 }
    ];
    function getNearestStationName(lat, lng) {
        if (typeof lat !== 'number' || typeof lng !== 'number') return null;
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

    // Thêm ánh xạ mã code sang tên khu
    const stationNames = {
        U: "Khu U",
        AB: "Khu AB",
        E: "Khu E",
        R: "Khu R"
    };

    // Hàm kiểm tra số hợp lệ
    function isValidNumber(val) {
        return typeof val === 'number' && !isNaN(val);
    }

    return (
        <div className="admin-trip-management">
            <div className="header">
                <h2>🚌 Quản lý Chuyến đi</h2>
                <div className="header-actions">
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setShowCreateForm(true)}
                    >
                        ➕ Tạo chuyến đi mới
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Filters */}
            <div className="filters">
                <h3>🔍 Bộ lọc</h3>
                <div className="filter-row">
                    
                    <select
                        value={filters.origin}
                        onChange={(e) => setFilters({...filters, origin: e.target.value})}
                    >
                        <option value="">Tất cả điểm đi</option>
                        {stationsFixed.map(station => (
                            <option key={station.code} value={station.code}>{station.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters.driverId}
                        onChange={(e) => setFilters({...filters, driverId: e.target.value})}
                    >
                        <option value="">Tất cả tài xế</option>
                        {drivers.map(driver => (
                            <option key={driver.id} value={driver.id}>{driver.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters.vehicleId}
                        onChange={(e) => setFilters({...filters, vehicleId: e.target.value})}
                    >
                        <option value="">Tất cả xe</option>
                        {vehicles.map(vehicle => (
                            <option key={vehicle.id} value={vehicle.id}>{vehicle.vehicleCode}</option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="CREATED">Đã tạo</option>
                        <option value="WAITING">Chờ khởi hành</option>
                        <option value="BOARDING">Đang lên xe</option>
                        <option value="RUNNING">Đang chạy</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="FINISHED">Đã kết thúc</option>
                    </select>
                </div>
            </div>

            {/* Trips Table */}
            <div className="trips-table">
                <h3>📋 Danh sách chuyến đi</h3>
                {loading ? (
                    <div className="loading">Đang tải...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tài xế</th>
                                <th>Xe</th>
                                <th>Điểm đi</th>
                                <th>Vị trí hiện tại</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips
                                .filter(trip => {
                                    // Lọc theo ngày
                                    if (filters.date && trip.startedAt) {
                                        const tripDate = new Date(trip.startedAt).toISOString().split('T')[0];
                                        if (tripDate !== filters.date) return false;
                                    }
                                    
                                    // Lọc theo điểm đi
                                    if (filters.origin && trip.origin !== filters.origin) {
                                        return false;
                                    }
                                    
                                    // Lọc theo tài xế
                                    if (filters.driverId && trip.driver?.id?.toString() !== filters.driverId.toString()) {
                                        return false;
                                    }
                                    
                                    // Lọc theo xe
                                    if (filters.vehicleId && trip.vehicle?.id?.toString() !== filters.vehicleId.toString()) {
                                        return false;
                                    }
                                    
                                    // Lọc theo trạng thái
                                    if (filters.status && trip.status !== filters.status) {
                                        return false;
                                    }
                                    
                                    return true;
                                })
                                .map(trip => (
                                <tr key={trip.id}>
                                    <td>{trip.id}</td>
                                    <td>{trip.driver?.name || 'N/A'}</td>
                                    <td>{trip.vehicle?.vehicleCode || 'N/A'}</td>
                                    <td>{stationsFixed.find(st => st.code === trip.origin)?.name || trip.origin || 'N/A'}</td>
                                    <td>{(() => {
                                        const loc = driverLocations[trip.driver?.id];
                                        if (!loc) return 'Không hoạt động';
                                        if (loc.status === 'MOVING') {
                                            // Hiển thị đúng tên khu của origin hiện tại
                                            const st = stationsFixed.find(st => st.code === trip.origin);
                                            return `Đang di chuyển tới ${st ? st.name : trip.origin}`;
                                        }
                                        return getNearestStationName(loc.latitude, loc.longitude);
                                    })()}</td>
                                    <td>
                                        <span 
                                            className="status-badge"
                                            style={{backgroundColor: getStatusColor(trip.status)}}
                                        >
                                            {getStatusText(trip.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    setSelectedTrip(trip);
                                                    setFormData({
                                                        driverId: trip.driver?.id || '',
                                                        notes: trip.notes || ''
                                                    });
                                                    setOrigin(trip.origin || '');
                                                    setShowEditForm(true);
                                                }}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDeleteTrip(trip.id)}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Trip Modal */}
            {showCreateForm && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>➕ Tạo chuyến đi mới</h3>
                            <button onClick={() => setShowCreateForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateTrip}>
                            <div className="form-group">
                                <label>Tài xế:</label>
                                <select
                                    required
                                    value={formData.driverId}
                                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                                >
                                    <option value="">Chọn tài xế</option>
                                    {drivers.filter(driver => driver.role === 'DRIVER').map(driver => (
                                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Điểm xuất phát:</label>
                                <select
                                    required
                                    value={origin}
                                    onChange={e => setOrigin(e.target.value)}
                                >
                                    <option value="">Chọn khu</option>
                                    {stationsFixed.map(st => (
                                        <option key={st.code} value={st.code}>{st.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ghi chú:</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Ghi chú cho chuyến đi..."
                                />
                            </div>
                            {vehicle && (
                                <div style={{marginTop:8, color:'#555'}}>
                                    <b>Xe của tài xế:</b> {vehicle.vehicleCode} - {vehicle.licensePlate} ({vehicle.type})
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang tạo...' : 'Tạo chuyến đi'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Trip Modal */}
            {showEditForm && selectedTrip && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>✏️ Chỉnh sửa chuyến đi #{selectedTrip.id}</h3>
                            <button onClick={() => setShowEditForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdateTrip}>
                            <div className="form-group">
                                <label>Tài xế:</label>
                                <select
                                    required
                                    value={formData.driverId}
                                    onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                                >
                                    <option value="">Chọn tài xế</option>
                                    {drivers.filter(driver => driver.role === 'DRIVER').map(driver => (
                                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Điểm xuất phát:</label>
                                <select
                                    required
                                    value={origin}
                                    onChange={e => setOrigin(e.target.value)}
                                >
                                    <option value="">Chọn khu</option>
                                    {stationsFixed.map(st => (
                                        <option key={st.code} value={st.code}>{st.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ghi chú:</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Ghi chú cho chuyến đi..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditForm(false)}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReport && (
                <div className="modal">
                    <div className="modal-content large">
                        <div className="modal-header">
                            <h3>📊 Báo cáo chuyến đi</h3>
                            <button onClick={() => setShowReport(false)}>✕</button>
                        </div>
                        <div className="report-filters">
                            <input
                                type="date"
                                placeholder="Từ ngày"
                                value={reportFilters.startDate}
                                onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})}
                            />
                            <input
                                type="date"
                                placeholder="Đến ngày"
                                value={reportFilters.endDate}
                                onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})}
                            />
                            <select
                                value={reportFilters.driverId}
                                onChange={(e) => setReportFilters({...reportFilters, driverId: e.target.value})}
                            >
                                <option value="">Tất cả tài xế</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                                ))}
                            </select>
                            <button onClick={generateReport} className="btn btn-primary">
                                Tạo báo cáo
                            </button>
                            <button onClick={exportToExcel} className="btn btn-secondary">
                                📥 Xuất Excel
                            </button>
                        </div>
                        {reportData.length > 0 && (
                            <div className="report-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID Chuyến</th>
                                            <th>Tài xế</th>
                                            <th>Mã xe</th>
                                            <th>Thời gian bắt đầu</th>
                                            <th>Thời gian kết thúc</th>
                                            <th>Trạng thái</th>
                                            <th>Tổng ghế</th>
                                            <th>Ghế trống</th>
                                            <th>Số đăng ký</th>
                                            <th>Tỷ lệ lấp đầy (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map(row => (
                                            <tr key={row.tripId}>
                                                <td>{row.tripId}</td>
                                                <td>{row.driverName}</td>
                                                <td>{row.vehicleCode}</td>
                                                <td>{row.startTime ? new Date(row.startTime).toLocaleString('vi-VN') : 'N/A'}</td>
                                                <td>{row.endTime ? new Date(row.endTime).toLocaleString('vi-VN') : 'N/A'}</td>
                                                <td>{getStatusText(row.status)}</td>
                                                <td>{row.totalSeats}</td>
                                                <td>{row.availableSeats}</td>
                                                <td>{row.registeredCount}</td>
                                                <td>{row.occupancyRate.toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Registration Detail Modal */}
            {showRegistrationDetail && selectedTripForRegistration && (
                <div className="modal">
                    <TripRegistrationDetail 
                        tripId={selectedTripForRegistration}
                        onClose={() => {
                            setShowRegistrationDetail(false);
                            setSelectedTripForRegistration(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminTripManagement; 