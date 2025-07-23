# HƯỚNG DẪN TEST CHỨC NĂNG QUẢN LÝ CHUYẾN ĐI & REALTIME UPDATES

## 1. Test chức năng Quản lý Chuyến đi (Admin)

### A. Tạo chuyến đi mới
1. Đăng nhập tài khoản admin.
2. Vào trang "Quản lý chuyến đi".
3. Nhấn nút "Tạo chuyến đi mới".
4. Chọn tài xế, điểm xuất phát, nhập ghi chú (nếu có).
5. Xác nhận tạo chuyến đi.
6. Kiểm tra chuyến mới xuất hiện trong danh sách, đầy đủ thông tin tài xế, xe, điểm đi.

### B. Sửa chuyến đi
1. Nhấn nút "Sửa" trên dòng chuyến đi cần chỉnh.
2. Thay đổi tài xế, điểm xuất phát hoặc ghi chú.
3. Nhấn "Cập nhật".
4. Kiểm tra thông tin chuyến đi được cập nhật đúng, không bị mất thông tin tài xế, xe, điểm đi.

### C. Xóa chuyến đi
1. Nhấn nút "Xóa" trên dòng chuyến đi cần xóa.
2. Xác nhận xóa.
3. Kiểm tra chuyến đi biến mất khỏi danh sách.

### D. Kiểm tra trạng thái chuyến đi
1. Quan sát cột trạng thái (CREATED, CONFIRMED, COMPLETED, ...).
2. Khi tài xế xác nhận/chạy/kết thúc chuyến, trạng thái phải cập nhật realtime (không cần F5).

---

## 2. Test chức năng Dashboard Driver & Realtime

### A. Nhận chuyến đi
1. Đăng nhập tài khoản driver.
2. Nếu có chuyến mới, popup "Bạn có chuyến đi mới!" sẽ hiện ra.
3. Nhấn "Nhận chuyến" để xác nhận.
4. Kiểm tra nút "ĐI" được enable ngay (không cần F5).
5. Admin thấy trạng thái chuyến đi chuyển sang CONFIRMED.

### B. Bắt đầu chuyến đi
1. Nhấn nút "ĐI" để bắt đầu di chuyển.
2. Quan sát icon tài xế di chuyển realtime trên bản đồ (MapRealtime).
3. Admin thấy trạng thái/chuyến đi cập nhật realtime.

### C. Kết thúc chuyến đi
1. Nhấn nút "KẾT THÚC CHUYẾN ĐI".
2. Kiểm tra trạng thái chuyến đi chuyển thành COMPLETED, các thông tin tài xế, xe, điểm đi vẫn giữ nguyên.
3. Admin thấy trạng thái cập nhật realtime, có thể tạo chuyến mới cho tài xế này.

### D. Hủy chuyến đi
1. Nếu chưa xác nhận, nhấn "Hủy chuyến".
2. Kiểm tra chuyến đi biến mất khỏi dashboard driver và cập nhật cho admin.

---

## 3. Test cập nhật realtime giữa driver và admin
1. Mở 2 trình duyệt: 1 tab đăng nhập admin, 1 tab đăng nhập driver.
2. Thực hiện các thao tác tạo/sửa/kết thúc chuyến đi ở driver.
3. Quan sát tab admin: mọi thay đổi trạng thái, thông tin chuyến đi đều cập nhật tự động (không cần F5).
4. Thực hiện thao tác sửa chuyến đi ở admin, kiểm tra tab driver cũng cập nhật thông tin mới.

---

## 4. Kiểm tra WebSocket và các lưu ý khi test
- Đảm bảo backend và frontend đều đang chạy.
- Kiểm tra console browser nếu có lỗi JavaScript hoặc WebSocket.
- Kiểm tra console backend nếu có lỗi API hoặc WebSocket.
- Nếu realtime không cập nhật, kiểm tra lại kết nối WebSocket và các topic subscribe.
- Test trên nhiều tab hoặc nhiều máy để kiểm tra realtime đồng bộ.

---

**Lưu ý:**
- Luôn gửi đầy đủ thông tin khi cập nhật chuyến đi.
- Sau mỗi thao tác thay đổi trạng thái, kiểm tra cả phía driver và admin đều cập nhật đúng.
- Sử dụng WebSocket để đồng bộ realtime, không cần F5 thủ công. 