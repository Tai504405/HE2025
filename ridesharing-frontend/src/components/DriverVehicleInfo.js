import React, { useState, useEffect } from 'react';

function DriverVehicleInfo() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: ''
  });

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  }

  const user = getUser();

  useEffect(() => {
    if (user && user.id) {
      fetchAssignedVehicles();
    }
  }, [user]);

  const fetchAssignedVehicles = async () => {
    try {
      const response = await fetch(`/api/driver/vehicles/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải phương tiện được phân công:', error);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      const response = await fetch(`/api/driver/vehicles/${user.id}/vehicle/${selectedVehicle.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updateData.status })
      });

      if (response.ok) {
        setShowUpdateForm(false);
        setSelectedVehicle(null);
        setUpdateData({ status: '', notes: '' });
        fetchAssignedVehicles();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
    }
  };

  const handleNotesUpdate = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    try {
      const response = await fetch(`/api/driver/vehicles/${user.id}/vehicle/${selectedVehicle.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updateData.notes })
      });

      if (response.ok) {
        setShowUpdateForm(false);
        setSelectedVehicle(null);
        setUpdateData({ status: '', notes: '' });
        fetchAssignedVehicles();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật ghi chú:', error);
    }
  };

  const handleUpdateClick = (vehicle, type) => {
    setSelectedVehicle(vehicle);
    setUpdateData({
      status: vehicle.status,
      notes: vehicle.notes || ''
    });
    setShowUpdateForm(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'ACTIVE': { text: '✅ Đang hoạt động', class: 'badge bg-success' },
      'MAINTENANCE': { text: '🔧 Bảo trì', class: 'badge bg-warning' },
      'BROKEN': { text: '❌ Hỏng', class: 'badge bg-danger' }
    };
    const statusInfo = statusMap[status] || { text: status, class: 'badge bg-secondary' };
    return <span className={statusInfo.class}>{statusInfo.text}</span>;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'ACTIVE': 'Đang hoạt động',
      'MAINTENANCE': 'Bảo trì',
      'BROKEN': 'Hỏng'
    };
    return statusMap[status] || status;
  };

  if (!user) {
    return <div className="alert alert-warning">Vui lòng đăng nhập để xem thông tin phương tiện.</div>;
  }

  return (
    <center>
    <div className="container mt-4">
      <h2>Thông tin phương tiện được phân công</h2>
      <h4>Xin chào, {user.name}!</h4>

      {vehicles.length === 0 ? (
        <div className="alert alert-info">
          Bạn chưa được phân công phương tiện nào. Vui lòng liên hệ admin để được phân công.
        </div>
      ) : (
        <div className="row">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="col-md-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    {vehicle.vehicleCode} - {vehicle.licensePlate}
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Mã xe:</strong> {vehicle.vehicleCode}</p>
                      <p><strong>Biển số:</strong> {vehicle.licensePlate}</p>
                      <p><strong>Sức chứa:</strong> {vehicle.seats} ghế</p>
                      <p><strong>Loại xe:</strong> {vehicle.type}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Trạng thái hiện tại:</strong></p>
                      <p>{getStatusBadge(vehicle.status)}</p>
                      <p><strong>Ghi chú:</strong></p>
                      <p>{vehicle.notes || 'Không có ghi chú'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <button 
                      className="btn btn-info btn-sm"
                      onClick={() => handleUpdateClick(vehicle, 'notes')}
                    >
                      📝 Cập nhật trạng thái và thông tin phương tiện
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form cập nhật trạng thái */}
      {showUpdateForm && selectedVehicle && (
        <center><div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cập nhật thông tin phương tiện</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedVehicle(null);
                    setUpdateData({ status: '', notes: '' });
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleStatusUpdate}>
                  <div className="mb-3">
                    <label className="form-label">Trạng thái phương tiện:</label>
                    <select
                      className="form-control"
                      value={updateData.status}
                      onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                      required
                    >
                      <option value="ACTIVE">✅ Đang hoạt động</option>
                      <option value="MAINTENANCE">🔧 Bảo trì</option>
                      <option value="BROKEN">❌ Hỏng</option>
                    </select>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Cập nhật trạng thái
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowUpdateForm(false);
                        setSelectedVehicle(null);
                        setUpdateData({ status: '', notes: '' });
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </form>

                <hr />

                <form onSubmit={handleNotesUpdate}>
                  <div className="mb-3">
                    <label className="form-label">Ghi chú:</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={updateData.notes}
                      onChange={(e) => setUpdateData({...updateData, notes: e.target.value})}
                      placeholder="Nhập ghi chú về tình trạng phương tiện..."
                    ></textarea>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-info">
                      Cập nhật ghi chú
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div></center>
      )}

      {/* Overlay cho modal */}
      {showUpdateForm && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div></center>
  );
}

export default DriverVehicleInfo; 