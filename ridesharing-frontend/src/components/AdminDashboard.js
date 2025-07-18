// src/components/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import MapRealtime from "./MapRealtime";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reportRoute, setReportRoute] = useState({});
  const [reportSchedule, setReportSchedule] = useState({});

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(setUsers);
    fetch('/api/vehicles').then(r => r.json()).then(setVehicles);
    fetch('/api/reports/trip-count-by-route').then(r => r.json()).then(setReportRoute);
    fetch('/api/reports/trip-count-by-schedule').then(r => r.json()).then(setReportSchedule);
  }, []);

  const handleDeleteUser = async (id) => {
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    fetch('/api/admin/users').then(r => r.json()).then(setUsers);
  };

  return (
    <div className="container mt-4">
      <h2>Quản trị hệ thống</h2>
      <h4>Quản lý người dùng</h4>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Mã SV/GV</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.studentId || u.teacherId || '-'}</td>
              <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}>Xóa</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Báo cáo lượt khách theo tuyến</h4>
      <ul>
        {Object.entries(reportRoute).map(([route, count]) => (
          <li key={route}>{route}: {count} lượt</li>
        ))}
      </ul>
      <h4>Báo cáo lượt khách theo khung giờ</h4>
      <ul>
        {Object.entries(reportSchedule).map(([sch, count]) => (
          <li key={sch}>{sch}: {count} lượt</li>
        ))}
      </ul>
      <h4>Danh sách xe</h4>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Biển số</th>
            <th>Số ghế</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(v => (
            <tr key={v.id}>
              <td>{v.id}</td>
              <td>{v.licensePlate}</td>
              <td>{v.seats}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Giám sát xe trên bản đồ</h4>
      <MapRealtime />
    </div>
  );
}

export default AdminDashboard;