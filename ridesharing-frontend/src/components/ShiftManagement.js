import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ShiftManagement.css';

const ShiftManagement = () => {
    const [shifts, setShifts] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        shiftType: 'SANG',
        startTime: '',
        endTime: '',
        notes: '',
        trips: []
    });

    // Trip form state
    const [tripForm, setTripForm] = useState({
        scheduleId: '',
        driverId: '',
        vehicleId: '',
        notes: ''
    });

    // Load dữ liệu lần đầu
    useEffect(() => {
        loadData(true);
    }, []);

    // Auto refresh dữ liệu mỗi 1 giây (không hiển thị loading)
    useEffect(() => {
        const interval = setInterval(() => {
            loadData(false);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            
            const [shiftsRes, driversRes, vehiclesRes, schedulesRes] = await Promise.all([
                axios.get('http://localhost:8080/api/shifts'),
                axios.get('http://localhost:8080/api/users?role=DRIVER'),
                axios.get('http://localhost:8080/api/vehicles'),
                axios.get('http://localhost:8080/api/bus-schedules')
            ]);
            
            setShifts(shiftsRes.data);
            setDrivers(driversRes.data);
            setVehicles(vehiclesRes.data);
            setSchedules(schedulesRes.data);
        } catch (error) {
            setError('Lỗi tải dữ liệu: ' + error.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleCreateShift = async (e) => {
        e.preventDefault();
        
        if (formData.trips.length === 0) {
            setError('Ca phải có ít nhất 1 chuyến đi');
            return;
        }

        try {
            setLoading(true);
            await axios.post('http://localhost:8080/api/shifts', formData);
            setSuccess('Tạo ca di chuyển thành công!');
            setShowCreateForm(false);
            resetForm();
            loadData(true);
        } catch (error) {
            setError('Lỗi tạo ca: ' + (error.response?.data || error.message));
        } finally {
            setLoading(false);
        }
    };

    const addTrip = () => {
        if (!tripForm.scheduleId || !tripForm.driverId) {
            setError('Vui lòng chọn lịch trình và tài xế');
            return;
        }

        // Kiểm tra trùng lịch trình
        const existingSchedule = formData.trips.find(trip => trip.scheduleId === tripForm.scheduleId);
        if (existingSchedule) {
            setError('Lịch trình này đã được thêm vào ca');
            return;
        }

        // Kiểm tra trùng tài xế
        const existingDriver = formData.trips.find(trip => trip.driverId === tripForm.driverId);
        if (existingDriver) {
            setError('Tài xế này đã được thêm vào ca');
            return;
        }

        setFormData({
            ...formData,
            trips: [...formData.trips, { ...tripForm }]
        });

        setTripForm({
            scheduleId: '',
            driverId: '',
            vehicleId: '',
            notes: ''
        });

        setError('');
    };

    const removeTrip = (index) => {
        const newTrips = formData.trips.filter((_, i) => i !== index);
        setFormData({
            ...formData,
            trips: newTrips
        });
    };

    const resetForm = () => {
        setFormData({
            shiftType: 'SANG',
            startTime: '',
            endTime: '',
            notes: '',
            trips: []
        });
        setTripForm({
            scheduleId: '',
            driverId: '',
            vehicleId: '',
            notes: ''
        });
        setError('');
        setSuccess('');
    };

    const getStatusColor = (status) => {
        const statusMap = {
            'CHO_XAC_NHAN': '#ffc107',
            'SAN_SANG_CHAY': '#28a745',
            'DANG_CHAY': '#17a2b8',
            'DA_HOAN_TAT': '#6c757d',
            'BI_HUY': '#dc3545'
        };
        return statusMap[status] || '#6c757d';
    };

    const getStatusText = (status) => {
        const statusMap = {
            'CHO_XAC_NHAN': 'Chờ xác nhận',
            'SAN_SANG_CHAY': 'Sẵn sàng chạy',
            'DANG_CHAY': 'Đang chạy',
            'DA_HOAN_TAT': 'Đã hoàn tất',
            'BI_HUY': 'Bị hủy'
        };
        return statusMap[status] || status;
    };

    const getShiftTypeText = (type) => {
        const typeMap = {
            'SANG': 'Sáng',
            'TRUA': 'Trưa',
            'CHIEU': 'Chiều'
        };
        return typeMap[type] || type;
    };

    return (
        <div className="container mt-4">
            <h2>Quản lý Ca Di Chuyển</h2>
            
            {/* Loading indicator */}
            {loading && (
                <div className="alert alert-info">
                    <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                </div>
            )}

            {/* Error/Success messages */}
            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}

            {/* Nút tạo ca mới */}
            {!showCreateForm && (
                <div className="mb-3">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateForm(true)}
                    >
                        <i className="fas fa-plus"></i> Tạo Ca Di Chuyển
                    </button>
                </div>
            )}

            {/* Form tạo ca */}
            {showCreateForm && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h5>Tạo Ca Di Chuyển Mới</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleCreateShift}>
                            {/* Thông tin ca */}
                            <div className="row mb-3">
                                <div className="col-md-3">
                                    <label className="form-label">Loại ca</label>
                                    <select
                                        className="form-control"
                                        value={formData.shiftType}
                                        onChange={(e) => setFormData({...formData, shiftType: e.target.value})}
                                        required
                                    >
                                        <option value="SANG">Sáng</option>
                                        <option value="TRUA">Trưa</option>
                                        <option value="CHIEU">Chiều</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Thời gian bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Thời gian kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">Ghi chú</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Form thêm chuyến đi */}
                            <div className="card mb-3">
                                <div className="card-header">
                                    <h6>Thêm chuyến đi</h6>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-3">
                                            <label className="form-label">Lịch trình</label>
                                            <select
                                                className="form-control"
                                                value={tripForm.scheduleId}
                                                onChange={(e) => setTripForm({...tripForm, scheduleId: e.target.value})}
                                            >
                                                <option value="">Chọn lịch trình</option>
                                                {schedules.map(schedule => (
                                                    <option key={schedule.id} value={schedule.id}>
                                                        {schedule.type} - {schedule.startTime} - {schedule.endTime}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Tài xế</label>
                                            <select
                                                className="form-control"
                                                value={tripForm.driverId}
                                                onChange={(e) => setTripForm({...tripForm, driverId: e.target.value})}
                                            >
                                                <option value="">Chọn tài xế</option>
                                                {drivers.map(driver => (
                                                    <option key={driver.id} value={driver.id}>
                                                        {driver.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Xe (tùy chọn)</label>
                                            <select
                                                className="form-control"
                                                value={tripForm.vehicleId}
                                                onChange={(e) => setTripForm({...tripForm, vehicleId: e.target.value})}
                                            >
                                                <option value="">Tự động gán</option>
                                                {vehicles.map(vehicle => (
                                                    <option key={vehicle.id} value={vehicle.id}>
                                                        {vehicle.vehicleCode} - {vehicle.licensePlate}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Ghi chú</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={tripForm.notes}
                                                onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-success"
                                            onClick={addTrip}
                                        >
                                            <i className="fas fa-plus"></i> Thêm chuyến đi
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách chuyến đi đã thêm */}
                            {formData.trips.length > 0 && (
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h6>Danh sách chuyến đi ({formData.trips.length})</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Lịch trình</th>
                                                        <th>Tài xế</th>
                                                        <th>Xe</th>
                                                        <th>Ghi chú</th>
                                                        <th>Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formData.trips.map((trip, index) => {
                                                        const schedule = schedules.find(s => s.id == trip.scheduleId);
                                                        const driver = drivers.find(d => d.id == trip.driverId);
                                                        const vehicle = vehicles.find(v => v.id == trip.vehicleId);
                                                        
                                                        return (
                                                            <tr key={index}>
                                                                <td>{schedule ? `${schedule.type} - ${schedule.startTime}-${schedule.endTime}` : 'N/A'}</td>
                                                                <td>{driver ? driver.name : 'N/A'}</td>
                                                                <td>{vehicle ? `${vehicle.vehicleCode} - ${vehicle.licensePlate}` : 'Tự động gán'}</td>
                                                                <td>{trip.notes || '-'}</td>
                                                                <td>
                                                                    <button 
                                                                        type="button"
                                                                        className="btn btn-danger btn-sm"
                                                                        onClick={() => removeTrip(index)}
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Đang tạo...' : 'Tạo Ca Di Chuyển'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        resetForm();
                                    }}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Danh sách ca */}
            <div className="card">
                <div className="card-header">
                    <h5>Danh sách Ca Di Chuyển</h5>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Loại ca</th>
                                    <th>Thời gian</th>
                                    <th>Trạng thái</th>
                                    <th>Số chuyến đi</th>
                                    <th>Tài xế đã xác nhận</th>
                                    <th>Ghi chú</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shifts.map(shift => (
                                    <tr key={shift.id}>
                                        <td>{shift.id}</td>
                                        <td>{getShiftTypeText(shift.shiftType)}</td>
                                        <td>
                                            {new Date(shift.startTime).toLocaleString('vi-VN')}<br/>
                                            <small>→ {new Date(shift.endTime).toLocaleString('vi-VN')}</small>
                                        </td>
                                        <td>
                                            <span 
                                                className="badge" 
                                                style={{backgroundColor: getStatusColor(shift.status)}}
                                            >
                                                {getStatusText(shift.status)}
                                            </span>
                                        </td>
                                        <td>{shift.trips ? shift.trips.length : 0}</td>
                                        <td>
                                            {shift.trips ? 
                                                `${shift.trips.filter(t => t.driverConfirmed).length}/${shift.trips.length}` : 
                                                '0/0'
                                            }
                                        </td>
                                        <td>{shift.notes || '-'}</td>
                                        <td>
                                            <div className="btn-group" role="group">
                                                <button className="btn btn-sm btn-info">
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button className="btn btn-sm btn-warning">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-sm btn-danger">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftManagement; 