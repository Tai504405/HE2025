import React, { useState, useEffect } from 'react';

function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [overview, setOverview] = useState({});
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleCode: '',
    licensePlate: '',
    seats: 30,
    type: 'Xe buýt',
    status: 'ACTIVE',
    notes: '',
    driverId: ''
  });

  // Hàm load dữ liệu
  const loadData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      await Promise.all([
        fetchVehicles(),
        fetchDrivers(),
        fetchOverview()
      ]);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Load dữ liệu lần đầu
  useEffect(() => {
    loadData(true);
  }, []);

  // Auto refresh dữ liệu mỗi 1 giây (không hiển thị loading)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false); // Không hiển thị loading khi auto refresh
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách phương tiện:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const users = await response.json();
      const driverUsers = users.filter(user => user.role === 'DRIVER');
      setDrivers(driverUsers);
    } catch (error) {
      console.error('Lỗi khi tải danh sách tài xế:', error);
    }
  };

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/vehicles/report/overview');
      const data = await response.json();
      setOverview(data);
    } catch (error) {
      console.error('Lỗi khi tải báo cáo:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = editingVehicle 
        ? `/api/vehicles/${editingVehicle.id}`
        : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowForm(false);
        setEditingVehicle(null);
        setFormData({
          vehicleCode: '',
          licensePlate: '',
          seats: 30,
          type: 'Xe buýt',
          status: 'ACTIVE',
          notes: '',
          driverId: ''
        });
        // Reload data sau khi lưu
        loadData(true);
      }
    } catch (error) {
      console.error('Lỗi khi lưu phương tiện:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicleCode: vehicle.vehicleCode || '',
      licensePlate: vehicle.licensePlate || '',
      seats: vehicle.seats || 30,
      type: vehicle.type || 'Xe buýt',
      status: vehicle.status || 'ACTIVE',
      notes: vehicle.notes || '',
      driverId: vehicle.driver ? vehicle.driver.id : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa phương tiện này?')) {
      try {
        setLoading(true);
        const response = await fetch(`/api/vehicles/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          // Reload data sau khi xóa
          loadData(true);
        }
      } catch (error) {
        console.error('Lỗi khi xóa phương tiện:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACTIVE': { text: 'Đang hoạt động', class: 'badge bg-success' },
      'MAINTENANCE': { text: 'Bảo trì', class: 'badge bg-warning' },
      'BROKEN': { text: 'Hỏng', class: 'badge bg-danger' }
    };
    const statusInfo = statusMap[status] || { text: status, class: 'badge bg-secondary' };
    return <span className={statusInfo.class}>{statusInfo.text}</span>;
  };

  return (
    <div className="container mt-4">
      <h2>Quản lý phương tiện</h2>
      
      {/* Loading indicator chỉ hiển thị khi thao tác thủ công */}
      {loading && (
        <div className="alert alert-info">
          <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
        </div>
      )}
      
      {/* Báo cáo tổng quan */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Tổng số xe</h5>
              <h3>{overview.total || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Đang hoạt động</h5>
              <h3>{overview.active || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h5 className="card-title">Bảo trì</h5>
              <h3>{overview.maintenance || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h5 className="card-title">Hỏng</h5>
              <h3>{overview.broken || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Form thêm/sửa phương tiện */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>{editingVehicle ? 'Sửa phương tiện' : 'Thêm phương tiện mới'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Mã xe</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.vehicleCode}
                      onChange={(e) => setFormData({...formData, vehicleCode: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Biển số</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Số ghế</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.seats}
                      onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Loại xe</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="Xe buýt">Xe buýt</option>
                      <option value="Xe khách">Xe khách</option>
                      <option value="Xe tải">Xe tải</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Trạng thái</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="MAINTENANCE">Bảo trì</option>
                      <option value="BROKEN">Hỏng</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Tài xế phụ trách</label>
                    <select
                      className="form-control"
                      value={formData.driverId}
                      onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                    >
                      <option value="">Chọn tài xế</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Ghi chú</label>
                    <textarea
                      className="form-control"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows="3"
                    />
                  </div>
                </div>
              </div>
              
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : (editingVehicle ? 'Cập nhật' : 'Thêm mới')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVehicle(null);
                    setFormData({
                      vehicleCode: '',
                      licensePlate: '',
                      seats: 30,
                      type: 'Xe buýt',
                      status: 'ACTIVE',
                      notes: '',
                      driverId: ''
                    });
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nút thêm mới */}
      {!showForm && (
        <div className="mb-3">
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <i className="fas fa-plus"></i> Thêm phương tiện mới
          </button>
        </div>
      )}

      {/* Bảng danh sách phương tiện */}
      <div className="card">
        <div className="card-header">
          <h5>Danh sách phương tiện</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mã xe</th>
                  <th>Biển số</th>
                  <th>Số ghế</th>
                  <th>Loại xe</th>
                  <th>Trạng thái</th>
                  <th>Tài xế</th>
                  <th>Ghi chú</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.id}</td>
                    <td>{vehicle.vehicleCode}</td>
                    <td>{vehicle.licensePlate}</td>
                    <td>{vehicle.seats}</td>
                    <td>{vehicle.type}</td>
                    <td>{getStatusBadge(vehicle.status)}</td>
                    <td>{vehicle.driver ? vehicle.driver.name : 'Chưa gán'}</td>
                    <td>{vehicle.notes || '-'}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button 
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(vehicle.id)}
                        >
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
}

export default VehicleManagement; 