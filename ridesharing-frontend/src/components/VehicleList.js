// src/components/VehicleList.js
import React from "react";

function VehicleList({ userId, vehicles, reloadVehicles }) {
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa phương tiện này?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/vehicles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa phương tiện thất bại");
      if (reloadVehicles) reloadVehicles();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div>
      <h3>Danh sách phương tiện của bạn</h3>
      {(!vehicles || vehicles.length === 0) ? (
        <p>Chưa có phương tiện nào.</p>
      ) : (
        <ul>
          {vehicles.map((v) => (
            <li key={v.id}>
              {v.licensePlate} - {v.type} - {v.brand}
              <button onClick={() => handleDelete(v.id)} style={{ marginLeft: 8 }}>Xóa</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default VehicleList;