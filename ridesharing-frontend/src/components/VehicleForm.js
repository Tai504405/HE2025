// src/components/VehicleForm.js
import React, { useState } from "react";

function VehicleForm({ userId, reloadVehicles }) {
  const [licensePlate, setLicensePlate] = useState("");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licensePlate, type, brand, ownerId: userId })
      });
      if (!res.ok) throw new Error("Không thể thêm phương tiện");
      setMessage("✅ Đã thêm phương tiện!");
      setLicensePlate("");
      setType("");
      setBrand("");
      if (reloadVehicles) reloadVehicles();
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };

  return (
    <div>
      <h3>Thêm phương tiện mới</h3>
      <form onSubmit={handleSubmit}>
        <label>Biển số xe:</label><br />
        <input
          type="text"
          placeholder="Nhập biển số xe"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          required
        /><br /><br />
        <label>Loại xe:</label><br />
        <input
          type="text"
          placeholder="Nhập loại xe (VD: 4 chỗ, 7 chỗ, xe máy...)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        /><br /><br />
        <label>Hãng xe:</label><br />
        <input
          type="text"
          placeholder="Nhập hãng xe"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
        /><br /><br />
        <button type="submit">Thêm xe</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default VehicleForm;