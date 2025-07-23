import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TripRegistrationDetail.css';

const TripRegistrationDetail = ({ tripId, onClose }) => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadRegistrations();
    }, [tripId]);

    const loadRegistrations = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8080/api/trip-registrations/trip/${tripId}`);
            setRegistrations(response.data);
        } catch (error) {
            setError('Lỗi tải danh sách đăng ký: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateRegistrationStatus = async (registrationId, newStatus) => {
        try {
            setLoading(true);
            await axios.put(`http://localhost:8080/api/trip-registrations/${registrationId}/status`, newStatus);
            loadRegistrations(); // Reload data
        } catch (error) {
            setError('Lỗi cập nhật trạng thái: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'REGISTERED': return 'blue';
            case 'BOARDED': return 'green';
            case 'CANCELLED': return 'red';
            default: return 'gray';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'REGISTERED': return 'Đã đăng ký';
            case 'BOARDED': return 'Đã lên xe';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div className="trip-registration-detail">
            <div className="modal-header">
                <h3>📋 Chi tiết đăng ký chuyến đi #{tripId}</h3>
                <button onClick={onClose}>✕</button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading ? (
                <div className="loading">Đang tải...</div>
            ) : (
                <div className="registration-content">
                    <div className="registration-summary">
                        <div className="summary-item">
                            <span className="label">Tổng số đăng ký:</span>
                            <span className="value">{registrations.length}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Đã lên xe:</span>
                            <span className="value">
                                {registrations.filter(r => r.status === 'BOARDED').length}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Đã hủy:</span>
                            <span className="value">
                                {registrations.filter(r => r.status === 'CANCELLED').length}
                            </span>
                        </div>
                    </div>

                    <div className="registration-list">
                        <h4>Danh sách đăng ký</h4>
                        {registrations.length === 0 ? (
                            <p className="no-data">Chưa có ai đăng ký chuyến đi này</p>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Họ tên</th>
                                        <th>Email</th>
                                        <th>Trạm đón</th>
                                        <th>Trạng thái</th>
                                        <th>QR Code</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrations.map(registration => (
                                        <tr key={registration.id}>
                                            <td>{registration.id}</td>
                                            <td>{registration.user?.name || 'N/A'}</td>
                                            <td>{registration.user?.email || 'N/A'}</td>
                                            <td>{registration.station?.name || 'N/A'}</td>
                                            <td>
                                                <span 
                                                    className="status-badge"
                                                    style={{backgroundColor: getStatusColor(registration.status)}}
                                                >
                                                    {getStatusText(registration.status)}
                                                </span>
                                            </td>
                                            <td>
                                                {registration.qrCode ? (
                                                    <div className="qr-code">
                                                        <img 
                                                            src={`data:image/png;base64,${registration.qrCode}`} 
                                                            alt="QR Code"
                                                            width="50"
                                                            height="50"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span>Chưa có</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {registration.status === 'REGISTERED' && (
                                                        <button 
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => updateRegistrationStatus(registration.id, 'BOARDED')}
                                                            disabled={loading}
                                                        >
                                                            ✅ Lên xe
                                                        </button>
                                                    )}
                                                    {registration.status === 'BOARDED' && (
                                                        <button 
                                                            className="btn btn-sm btn-warning"
                                                            onClick={() => updateRegistrationStatus(registration.id, 'REGISTERED')}
                                                            disabled={loading}
                                                        >
                                                            ↩️ Hủy lên xe
                                                        </button>
                                                    )}
                                                    {registration.status !== 'CANCELLED' && (
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => updateRegistrationStatus(registration.id, 'CANCELLED')}
                                                            disabled={loading}
                                                        >
                                                            ❌ Hủy
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripRegistrationDetail; 