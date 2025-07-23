import React, { useState, useEffect } from 'react';

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER'
  });
  const [editingUser, setEditingUser] = useState(null);

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
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setNewUser({ name: '', email: '', password: '', role: 'USER' });
        // Reload data sau khi tạo
        loadData(true);
        alert('Tạo tài khoản thành công!');
      } else {
        alert('Lỗi khi tạo tài khoản!');
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
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingUser),
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
    <div className="container mt-4">
      <h2>Quản lý tài khoản</h2>
      
      {/* Loading indicator chỉ hiển thị khi thao tác thủ công */}
      {loading && (
        <div className="alert alert-info">
          <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
        </div>
      )}
      
      {/* Form tạo tài khoản mới */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Tạo tài khoản mới</h5>
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
                <select
                  className="form-control"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="USER">Người dùng</option>
                  <option value="DRIVER">Tài xế</option>
                </select>
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Danh sách tài khoản */}
      <div className="card">
        <div className="card-header">
          <h5>Danh sách tài khoản</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Thao tác</th>
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
                          <option value="USER">Người dùng</option>
                          <option value="DRIVER">Tài xế</option>
                          <option value="ADMIN">Quản trị viên</option>
                        </select>
                      ) : (
                        getRoleBadge(user.role)
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
                            <i className="fas fa-save"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => setEditingUser(null)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-sm btn-warning"
                            onClick={() => setEditingUser(user)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {user.role !== 'ADMIN' && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={loading}
                            >
                              <i className="fas fa-trash"></i>
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