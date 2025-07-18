import React, { useState } from 'react';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg);
        return;
      }
      setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => window.location.href = '/login', 1500);
    } catch (e) {
      setError('Lỗi kết nối');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto', marginTop: 40 }}>
      <h2>Đăng ký tài khoản</h2>
      <input type="text" placeholder="Họ tên" value={name} onChange={e => setName(e.target.value)} required className="form-control mb-2" />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="form-control mb-2" />
      <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required className="form-control mb-2" />
      <select value={role} onChange={e => setRole(e.target.value)} className="form-control mb-2">
        <option value="USER">Sinh viên/Giảng viên</option>
        <option value="DRIVER">Tài xế</option>
      </select>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      <button type="submit" className="btn btn-success w-100">Đăng ký</button>
    </form>
  );
}

export default RegisterForm;
