import React, { useState } from 'react';
import MapRealtime from "./MapRealtime";

function LoginForm({ onLogin }) {
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

  return (
    <>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto', marginTop: 40 }}>
        <h2>Đăng nhập</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="form-control mb-2" />
        <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required className="form-control mb-2" />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" className="btn btn-primary w-100 mb-2">Đăng nhập</button>
        <button type="button" className="btn btn-link w-100" onClick={() => window.location.href = '/register'}>Chưa có tài khoản? Đăng ký</button>
      </form>
      <MapRealtime />
    </>
  );
}

export default LoginForm;
