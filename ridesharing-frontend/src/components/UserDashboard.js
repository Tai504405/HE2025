import React from "react";
import MapRealtime from "./MapRealtime";

const UserDashboard = ({ user }) => (
  <div>
    <h2>Trang người dùng</h2>
    <p>Xin chào, {user?.name}!</p>
    <p>Chức năng: Xem thông tin cá nhân, chuyến đi, phương tiện, v.v.</p>
    <MapRealtime />
  </div>
);
export default UserDashboard; 