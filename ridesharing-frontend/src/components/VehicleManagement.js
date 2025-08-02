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
    <div className="container mt-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Quản lý phương tiện</h2>
              <p className="text-muted mb-0">Quản lý và theo dõi tất cả phương tiện trong hệ thống</p>
            </div>
            {!showForm && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Thêm phương tiện mới
              </button>
            )}
          </div>
          
          {/* Loading indicator */}
          {loading && (
            <div className="alert alert-info">
              <i className="fas fa-spinner fa-spin me-2"></i>
              Đang tải dữ liệu...
            </div>
          )}
          
          {/* Báo cáo tổng quan */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="card-title">Tổng số xe: {overview.total || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="card-title">Đang hoạt động: {overview.active || 0}</h3>
                </div>
              </div>
            </div>  
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="card-title">Bảo trì: {overview.maintenance || 0}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-danger text-white">
                <div className="card-body text-center">
                  <h3 className="card-title">Hỏng: {overview.broken || 0}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Form thêm/sửa phương tiện */}
          {showForm && (
            <div className="card mb-4" style={{ border: '2px solid #dee2e6', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <div className="card-header" style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <h2 className="mb-0 text-center">
                  {editingVehicle ? 'Sửa phương tiện' : 'Thêm phương tiện mới'}
                </h2>
              </div>
              <div className="card-body" style={{ padding: '30px' }}>
                <form onSubmit={handleSubmit}>
                  <table className="table table-borderless" style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '30%', verticalAlign: 'top', padding: '10px 15px' }}>
                          <label className="form-label fw-bold">Mã xe</label>
                        </td>
                        <td style={{ width: '70%', padding: '10px 15px' }}>
                          <input
                            type="text"
                            className="form-control"
                            style={{ border: '1px solid #ced4da', borderRadius: '5px' }}
                            value={formData.vehicleCode}
                            onChange={(e) => setFormData({...formData, vehicleCode: e.target.value})}
                            required
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '30%', verticalAlign: 'top', padding: '10px 15px' }}>
                          <label className="form-label fw-bold">Biển số</label>
                        </td>
                        <td style={{ width: '70%', padding: '10px 15px' }}>
                          <input
                            type="text"
                            className="form-control"
                            style={{ border: '1px solid #ced4da', borderRadius: '5px' }}
                            value={formData.licensePlate}
                            onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                            required
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '30%', verticalAlign: 'top', padding: '10px 15px' }}>
                          <label className="form-label fw-bold">Số ghế</label>
                        </td>
                        <td style={{ width: '70%', padding: '10px 15px' }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ border: '1px solid #ced4da', borderRadius: '5px' }}
                            value={formData.seats}
                            onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value)})}
                            required
                          />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '30%', verticalAlign: 'top', padding: '10px 15px' }}>
                          <label className="form-label fw-bold">Loại xe</label>
                        </td>
                        <td style={{ width: '70%', padding: '10px 15px' }}>
                          <select
                            className="form-control"
                            style={{ border: '1px solid #ced4da', borderRadius: '5px' }}
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                          >
                            <option value="Xe buýt">Xe buýt</option>
                            <option value="Xe khách">Xe khách</option>
                            <option value="Xe tải">Xe tải</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '30%', verticalAlign: 'top', padding: '10px 15px' }}>
                          <label className="form-label fw-bold">Trạng thái</label>
                        </td>
                        <td style={{ width: '70%', padding: '10px 15px' }}>
                          <select
                            className="form-control"
                            style={{ border: '1px solid #ced4da', borderRadius: '5px' }}
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                          >
                            <option value="ACTIVE">Đang hoạt động</option>
                            <option value="MAINTENANCE">Bảo trì</option>
                            <option value="BROKEN">Hỏng</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '30%', verticalAlign: 'top', padding: '10px 15px' }}>
                          <label className="form-label fw-bold">Tài xế phụ trách</label>
                        </td>
                        <td style={{ width: '70%', padding: '10px 15px' }}>
                          <select
                            className="form-control"
                            style={{ border: '1px solid #ced4da', borderRadius: '5px' }}
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
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '30%', verticalAlign: 'top', padding: '10px 15px' }}>
                          <label className="form-label fw-bold">Ghi chú</label>
                        </td>
                        <td style={{ width: '70%', padding: '10px 15px' }}>
                          <textarea
                            className="form-control"
                            style={{ border: '1px solid #ced4da', borderRadius: '5px' }}
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows="3"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="d-flex justify-content-center gap-3 mt-4">
                    <button type="submit" className="btn btn-primary px-4 py-2" disabled={loading}>
                      {loading ? 'Đang lưu...' : (editingVehicle ? 'Cập nhật' : 'Thêm mới')}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary px-4 py-2"
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

          {/* Bảng danh sách phương tiện */}
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Danh sách phương tiện</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>ID</th>
                      <th style={{ width: '12%' }}>Mã xe</th>
                      <th style={{ width: '15%' }}>Biển số</th>
                      <th style={{ width: '8%' }}>Số ghế</th>
                      <th style={{ width: '15%' }}>Loại xe</th>
                      <th style={{ width: '12%' }}>Trạng thái</th>
                      <th style={{ width: '15%' }}>Tài xế</th>
                      <th style={{ width: '13%' }}>Ghi chú</th>
                      <th style={{ width: '5%' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(vehicle => (
                      <tr key={vehicle.id}>
                        <td style={{ wordWrap: 'break-word' }}>{vehicle.id}</td>
                        <td style={{ wordWrap: 'break-word' }}>{vehicle.vehicleCode}</td>
                        <td style={{ wordWrap: 'break-word' }}>{vehicle.licensePlate}</td>
                        <td style={{ wordWrap: 'break-word' }}>{vehicle.seats}</td>
                        <td style={{ wordWrap: 'break-word' }}>{vehicle.type}</td>
                        <td style={{ wordWrap: 'break-word' }}>{getStatusBadge(vehicle.status)}</td>
                        <td style={{ wordWrap: 'break-word' }}>{vehicle.driver ? vehicle.driver.name : 'Chưa gán'}</td>
                        <td style={{ wordWrap: 'break-word' }}>{vehicle.notes || '-'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-sm btn-warning"
                              onClick={() => handleEdit(vehicle)}
                            >
                              <i className="fas fa-edit">sửa</i>
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(vehicle.id)}
                            >
                              <i className="fas fa-trash">xóa</i>
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
      </div>
    </div>
  );
}

export default VehicleManagement; 