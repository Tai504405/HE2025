import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
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
  return (
    <button className="btn btn-outline-danger" onClick={() => {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }}>Đăng xuất</button>
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
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/admin/*" element={user && user.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/driver/*" element={user && user.role === 'DRIVER' ? <DriverDashboard /> : <Navigate to="/login" />} />
        <Route path="/user/*" element={user && user.role === 'USER' ? <UserDashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
