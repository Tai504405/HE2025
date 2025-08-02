import React, { useState, useEffect } from 'react';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'DRIVER'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});

  // Hàm load dữ liệu
  const loadData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      await fetchUsers();
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
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
      loadData(false); // Không hiển thị loading khi auto refresh
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu xác nhận
    if (newUser.password !== newUser.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    // Kiểm tra độ dài mật khẩu
    if (newUser.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    try {
      setLoading(true);
      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setNewUser({ name: '', email: '', password: '', confirmPassword: '', role: 'DRIVER' });
        setShowCreateForm(false);
        // Reload data sau khi tạo
        loadData(true);
        alert('Tạo tài khoản thành công!');
      } else {
        const errorData = await response.json();
        alert(`Lỗi khi tạo tài khoản: ${errorData.message || 'Không xác định'}`);
      }
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Lỗi khi tạo tài khoản!');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu xác nhận nếu có nhập mật khẩu mới
    if (editingUser.newPassword && editingUser.newPassword !== editingUser.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    // Kiểm tra độ dài mật khẩu nếu có nhập mật khẩu mới
    if (editingUser.newPassword && editingUser.newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    try {
      setLoading(true);
      const userData = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      };

      // Chỉ gửi mật khẩu mới nếu có nhập
      if (editingUser.newPassword) {
        userData.password = editingUser.newPassword;
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setEditingUser(null);
        // Reload data sau khi cập nhật
        loadData(true);
        alert('Cập nhật tài khoản thành công!');
      } else {
        alert('Lỗi khi cập nhật tài khoản!');
      }
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Lỗi khi cập nhật tài khoản!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản này?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload data sau khi xóa
        loadData(true);
        alert('Xóa tài khoản thành công!');
      } else {
        alert('Lỗi khi xóa tài khoản!');
      }
    } catch (error) {
      console.error('Lỗi:', error);
      alert('Lỗi khi xóa tài khoản!');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      'ADMIN': { text: 'Quản trị viên', class: 'badge bg-danger' },
      'DRIVER': { text: 'Tài xế', class: 'badge bg-warning' },
      'USER': { text: 'Người dùng', class: 'badge bg-info' }
    };
    const roleInfo = roleMap[role] || { text: role, class: 'badge bg-secondary' };
    return <span className={roleInfo.class}>{roleInfo.text}</span>;
  };

  return (
    <div className="container mt-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Quản lý tài khoản</h2>
          <p className="text-muted mb-0">Quản lý và tạo tài khoản người dùng trong hệ thống</p>
        </div>
        {!showCreateForm && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Thêm tài khoản mới
          </button>
        )}
      </div>
      
      {/* Loading indicator chỉ hiển thị khi thao tác thủ công */}
      {loading && (
        <div className="alert alert-info">
          <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
        </div>
      )}
      
      {/* Form tạo tài khoản mới */}
      {showCreateForm && (
        <center><div className="card mb-4">
          <div className="card-header">
            <h3>Tạo tài khoản mới</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateUser}>
              <div className="row">
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Họ tên"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Mật khẩu"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-2">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Xác nhận mật khẩu"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="form-control"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="DRIVER">Tài xế</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-12">
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewUser({ name: '', email: '', password: '', confirmPassword: '', role: 'DRIVER' });
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        </center>
      )}

      {/* Danh sách tài khoản */}
      <div className="card">
        <div className="card-header">
          <h5>Danh sách tài khoản</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>ID</th>
                  <th style={{ width: '20%' }}>Họ tên</th>
                  <th style={{ width: '25%' }}>Email</th>
                  <th style={{ width: '15%' }}>Vai trò</th>
                  <th style={{ width: '12%' }}>Mật khẩu</th>
                  <th style={{ width: '20%' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      {editingUser?.id === user.id ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                        />
                      ) : (
                        user.name
                      )}
                    </td>
                    <td>
                      {editingUser?.id === user.id ? (
                        <input
                          type="email"
                          className="form-control"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td>
                      {editingUser?.id === user.id ? (
                        <select
                          className="form-control"
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                        >
                          <option value="DRIVER">Tài xế</option>
                          <option value="ADMIN">Quản trị viên</option>
                        </select>
                      ) : (
                        getRoleBadge(user.role)
                      )}
                    </td>
                    <td>
                      {editingUser?.id === user.id ? (
                        <div className="d-flex align-items-center">
                          <input
                            type={showPasswords.edit ? 'text' : 'password'}
                            className="form-control me-2"
                            placeholder="Mật khẩu mới"
                            value={editingUser.newPassword || ''}
                            onChange={(e) => setEditingUser({...editingUser, newPassword: e.target.value})}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setShowPasswords({
                              ...showPasswords,
                              edit: !showPasswords.edit
                            })}
                          >
                            <span title={showPasswords.edit ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                              {showPasswords.edit ? '👁️‍🗨️' : '👁️'}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center">
                          <span className="text-muted me-2">
                            {showPasswords[user.id] ? user.password || '••••••' : '••••••'}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setShowPasswords({
                              ...showPasswords,
                              [user.id]: !showPasswords[user.id]
                            })}
                            style={{ padding: '2px 6px', fontSize: '12px' }}
                          >
                            <span title={showPasswords[user.id] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                              {showPasswords[user.id] ? '👁️‍🗨️' : '👁️'}
                            </span>
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {editingUser?.id === user.id ? (
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={handleUpdateUser}
                            disabled={loading}
                          >
                            <i className="fas fa-save"> lưu</i>
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingUser(null)}
                          >
                            <i className="fas fa-times"> hủy</i>
                          </button>
                        </div>
                      ) : (
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => setEditingUser({
                              ...user,
                              newPassword: '',
                              confirmPassword: ''
                            })}
                          >
                            <i className="fas fa-edit"> sửa</i>
                          </button>
                          {user.role !== 'ADMIN' && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={loading}
                            >
                              <i className="fas fa-trash"> xóa</i>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      
    </div>
  );
}

export default AdminUserManagement; 