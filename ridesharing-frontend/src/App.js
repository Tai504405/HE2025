import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import LoginForm from './components/LoginForm';

import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import UserDashboard from './components/UserDashboard';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function LogoutButton() {
  const user = getUser();
  
  const handleLogout = async () => {
    // Nếu là driver, kết thúc chuyến đi trước khi đăng xuất
    if (user && user.role === 'DRIVER') {
      try {
        // Lấy tripId từ localStorage
        const currentTripId = localStorage.getItem('currentTripId');
        if (currentTripId) {
          // Kết thúc chuyến đi
          await fetch(`/api/realtime/trip/${currentTripId}/end`, { 
            method: 'POST' 
          });
          // Xóa tripId khỏi localStorage
          localStorage.removeItem('currentTripId');
        }
      } catch (error) {
        console.error('Lỗi khi kết thúc chuyến đi:', error);
      }
    }
    
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <button className="btn btn-outline-danger" onClick={handleLogout}>
      Đăng xuất
    </button>
  );
}

function App() {
  const user = getUser();

  return (
    <Router>
      <nav className="navbar navbar-expand navbar-light bg-light">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">HUTECH Bus</Link>
          <div className="d-flex">
            {user && <LogoutButton />}
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role.toLowerCase()}`} /> : <LoginForm />} />

        <Route path="/admin/*" element={user && user.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/driver/*" element={user && user.role === 'DRIVER' ? <DriverDashboard /> : <Navigate to="/login" />} />
        <Route path="/user/*" element={user && user.role === 'USER' ? <UserDashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
