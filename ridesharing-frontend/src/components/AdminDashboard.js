// src/components/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import MapRealtime from "./MapRealtime";
import VehicleManagement from "./VehicleManagement";
import AdminUserManagement from "./AdminUserManagement";
import AdminTripManagement from "./AdminTripManagement";
import ShiftManagement from "./ShiftManagement";

function AdminDashboard({ activeTab, setActiveTab }) {
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reportRoute, setReportRoute] = useState({});
  const [reportSchedule, setReportSchedule] = useState({});
  const [loading, setLoading] = useState(false);

  // Hàm load dữ liệu
  const loadData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [usersRes, vehiclesRes, routeRes, scheduleRes] = await Promise.all([
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/vehicles').then(r => r.json()),
        fetch('/api/reports/trip-count-by-route').then(r => r.json()),
        fetch('/api/reports/trip-count-by-schedule').then(r => r.json())
      ]);
      
      setUsers(usersRes);
      setVehicles(vehiclesRes);
      setReportRoute(routeRes);
      setReportSchedule(scheduleRes);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
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
      if (activeTab === 'dashboard') {
        loadData(false); // Không hiển thị loading khi auto refresh
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleDeleteUser = async (id) => {
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      // Reload data sau khi xóa
      loadData(true);
    } catch (error) {
      console.error('Lỗi xóa user:', error);
    }
  };

  return (
    <div className="container mt-4">
      <center><h2>Quản trị hệ thống</h2></center>
      
      {/* Loading indicator chỉ hiển thị khi load lần đầu hoặc thao tác thủ công */}
      {loading && (
        <div className="alert alert-info">
          <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          <center><h4>Giám sát xe trên bản đồ</h4></center>
          <MapRealtime />
        </div>
      )}

      {/* Shifts Tab */}
      {activeTab === 'shifts' && (
        <ShiftManagement />
      )}

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <AdminTripManagement />
      )}

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <VehicleManagement />
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <AdminUserManagement />
      )}
    </div>
  );
}

export default AdminDashboard;