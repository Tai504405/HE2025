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
    <button 
      className="btn btn-sm" 
      onClick={handleLogout}
      style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
        border: 'none',
        borderRadius: '20px',
        padding: '8px 20px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
        transition: 'all 0.3s ease'
      }}
    >
      Đăng xuất
    </button>
  );
}

function AdminNavTabs({ activeTab, setActiveTab }) {
  return (
    <div className="d-flex align-items-center justify-content-between" style={{ width: '100%' }}>
      <button 
        className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-light' : 'btn-outline-light'}`}
        onClick={() => setActiveTab('dashboard')}
        style={{ 
          fontSize: '0.85rem', 
          padding: '10px 20px', 
          borderRadius: '20px',
          fontWeight: '600',
          border: 'none',
          transition: 'all 0.3s ease',
          boxShadow: activeTab === 'dashboard' ? '0 4px 15px rgba(255,255,255,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          background: activeTab === 'dashboard' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
            : 'rgba(255,255,255,0.1)',
          color: activeTab === 'dashboard' ? '#333' : '#fff',
          backdropFilter: 'blur(10px)',
          flex: '1',
          margin: '0 5px'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'dashboard') {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'dashboard') {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
      >
        Trang chủ
      </button>
      <button 
        className={`btn btn-sm ${activeTab === 'trips' ? 'btn-light' : 'btn-outline-light'}`}
        onClick={() => setActiveTab('trips')}
        style={{ 
          fontSize: '0.85rem', 
          padding: '10px 20px', 
          borderRadius: '20px',
          fontWeight: '600',
          border: 'none',
          transition: 'all 0.3s ease',
          boxShadow: activeTab === 'trips' ? '0 4px 15px rgba(255,255,255,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          background: activeTab === 'trips' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
            : 'rgba(255,255,255,0.1)',
          color: activeTab === 'trips' ? '#333' : '#fff',
          backdropFilter: 'blur(10px)',
          flex: '1',
          margin: '0 5px'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'trips') {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'trips') {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
      >
        Chuyến đi
      </button>
      <button 
        className={`btn btn-sm ${activeTab === 'vehicles' ? 'btn-light' : 'btn-outline-light'}`}
        onClick={() => setActiveTab('vehicles')}
        style={{ 
          fontSize: '0.85rem', 
          padding: '10px 20px', 
          borderRadius: '20px',
          fontWeight: '600',
          border: 'none',
          transition: 'all 0.3s ease',
          boxShadow: activeTab === 'vehicles' ? '0 4px 15px rgba(255,255,255,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          background: activeTab === 'vehicles' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
            : 'rgba(255,255,255,0.1)',
          color: activeTab === 'vehicles' ? '#333' : '#fff',
          backdropFilter: 'blur(10px)',
          flex: '1',
          margin: '0 5px'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'vehicles') {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'vehicles') {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
      >
        Phương tiện
      </button>
      <button 
        className={`btn btn-sm ${activeTab === 'users' ? 'btn-light' : 'btn-outline-light'}`}
        onClick={() => setActiveTab('users')}
        style={{ 
          fontSize: '0.85rem', 
          padding: '10px 20px', 
          borderRadius: '20px',
          fontWeight: '600',
          border: 'none',
          transition: 'all 0.3s ease',
          boxShadow: activeTab === 'users' ? '0 4px 15px rgba(255,255,255,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          background: activeTab === 'users' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
            : 'rgba(255,255,255,0.1)',
          color: activeTab === 'users' ? '#333' : '#fff',
          backdropFilter: 'blur(10px)',
          flex: '1',
          margin: '0 5px'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'users') {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'users') {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
      >
        Tài khoản
      </button>
    </div>
  );
}

function DriverNavTabs({ activeTab, setActiveTab }) {
  return (
    
    <div className="d-flex align-items-center justify-content-between" style={{ width: '100%' }}>
      
      <button 
        className={`btn btn-sm ${activeTab === 'control' ? 'btn-light' : 'btn-outline-light'}`}
        onClick={() => setActiveTab('control')}
        style={{ 
          fontSize: '0.85rem', 
          padding: '10px 20px', 
          borderRadius: '20px',
          fontWeight: '600',
          border: 'none',
          transition: 'all 0.3s ease',
          boxShadow: activeTab === 'control' ? '0 4px 15px rgba(255,255,255,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          background: activeTab === 'control' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
            : 'rgba(255,255,255,0.1)',
          color: activeTab === 'control' ? '#333' : '#fff',
          backdropFilter: 'blur(10px)',
          flex: '1',
          margin: '0 5px'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'control') {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'control') {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
      >
        Điều khiển xe bus
      </button>
      <button 
        className={`btn btn-sm ${activeTab === 'vehicle' ? 'btn-light' : 'btn-outline-light'}`}
        onClick={() => setActiveTab('vehicle')}
        style={{ 
          fontSize: '0.85rem', 
          padding: '10px 20px', 
          borderRadius: '20px',
          fontWeight: '600',
          border: 'none',
          transition: 'all 0.3s ease',
          boxShadow: activeTab === 'vehicle' ? '0 4px 15px rgba(255,255,255,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          background: activeTab === 'vehicle' 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' 
            : 'rgba(255,255,255,0.1)',
          color: activeTab === 'vehicle' ? '#333' : '#fff',
          backdropFilter: 'blur(10px)',
          flex: '1',
          margin: '0 5px'
        }}
        onMouseEnter={(e) => {
          if (activeTab !== 'vehicle') {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (activeTab !== 'vehicle') {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
      >
        Thông tin phương tiện
      </button>
    </div>
  );
}

function App() {
  const user = getUser();
  const [adminActiveTab, setAdminActiveTab] = React.useState('dashboard');
  const [driverActiveTab, setDriverActiveTab] = React.useState('control');

  return (
    <Router>
      <nav className="navbar navbar-expand" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '15px 0'
      }}>
        <div className="container-fluid" style={{ 
          display: 'grid', 
          gridTemplateColumns: '20% 60% 10%',
          alignItems: 'center',
          gap: '20px'
        }}>
          {/* Left section - HUTECH BUS */}
          <Link className="navbar-brand d-flex align-items-center" to="/" style={{ 
            textDecoration: 'none',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            justifySelf: 'start'
          }}>
            <img src="/logo192.png" alt="HUTECH Bus Logo" style={{ 
              width: '25px', 
              height: '25px', 
              marginRight: '12px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }} />
            HUTECH BUS
          </Link>

          {/* Center section - Admin/Driver tabs */}
          <div style={{ justifySelf: 'center' }}>
            {user && user.role === 'ADMIN' && (
              <AdminNavTabs activeTab={adminActiveTab} setActiveTab={setAdminActiveTab} />
            )}
            {user && user.role === 'DRIVER' && (
              <DriverNavTabs activeTab={driverActiveTab} setActiveTab={setDriverActiveTab} />
            )}
          </div>

          {/* Right section - Login/Logout */}
          <div style={{ justifySelf: 'end' }}>
            {user ? (
              <LogoutButton />
            ) : (
              <LoginForm isInline={true} />
            )}
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={`/${user.role.toLowerCase()}`} /> : <LoginForm />} />

        <Route path="/admin/*" element={user && user.role === 'ADMIN' ? <AdminDashboard activeTab={adminActiveTab} setActiveTab={setAdminActiveTab} /> : <Navigate to="/login" />} />
        <Route path="/driver/*" element={user && user.role === 'DRIVER' ? <DriverDashboard activeTab={driverActiveTab} setActiveTab={setDriverActiveTab} /> : <Navigate to="/login" />} />
        <Route path="/user/*" element={user && user.role === 'USER' ? <UserDashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : '/login'} />} />
      </Routes>
    </Router>
  );
}

export default App;
