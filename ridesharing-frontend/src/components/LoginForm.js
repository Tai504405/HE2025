import React, { useState } from 'react';
import MapRealtime from "./MapRealtime";

function LoginForm({ onLogin, isInline = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg);
        return;
      }
      const user = await res.json();
      localStorage.setItem('user', JSON.stringify(user));
      if (onLogin) onLogin(user);
      // Chuyển hướng theo role
      if (user.role === 'ADMIN') window.location.href = '/admin';
      else if (user.role === 'DRIVER') window.location.href = '/driver';
      else window.location.href = '/user';
    } catch (e) {
      setError('Lỗi kết nối');
    }
  };

  // Nếu là inline form (cho header)
  if (isInline) {
    return (
      <form onSubmit={handleSubmit} className="d-flex align-items-center" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
          className="form-control form-control-sm me-2" 
          style={{ 
            width: '160px',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 15px',
            fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0
          }}
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
          className="form-control form-control-sm me-2" 
          style={{ 
            width: '120px',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 15px',
            fontSize: '0.9rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            flexShrink: 0
          }}
        />
        <button type="submit" className="btn btn-sm" style={{
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
          border: 'none',
          borderRadius: '20px',
          padding: '8px 20px',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
          transition: 'all 0.3s ease',
          flexShrink: 0
        }}>Đăng nhập</button>
        {error && <small className="text-light ms-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)', flexShrink: 0 }}>{error}</small>}
      </form>
    );
  }

  // Form đăng nhập đầy đủ (cho trang login riêng)
  return (
    <>
      {/* <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto', marginTop: 40 }}>
        <h2>Đăng nhập</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="form-control mb-2" />
        <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required className="form-control mb-2" />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" className="btn btn-primary w-100 mb-2">Đăng nhập</button>
      </form> */}
      <MapRealtime />
    </>
  );
}

export default LoginForm;