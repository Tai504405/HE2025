# Tổng hợp các lỗi đã sửa và giải pháp (Test Fixes)

## 1. Không cập nhật điểm đi sau khi nhấn nút "Đi" (driver)
- **Lỗi:** Sau khi nhấn "Đi", điểm đi (origin) không tự động cập nhật, phải F5 mới thấy.
- **Cách sửa:** Sau khi gọi API update-origin-by-driver, frontend refetch lại trip_plan để cập nhật state mới.

## 2. Ẩn/hiện các nút thao tác trên dashboard driver
- **Lỗi:** Các nút chọn điểm xuất phát, tới nơi, kết thúc chuyến đi hiển thị không đúng yêu cầu.
- **Cách sửa:** Ẩn các nút không cần thiết, chỉ giữ lại nút "ĐI" và "KẾT THÚC CHUYẾN ĐI".

## 3. Sửa chuyến đi ở admin không cập nhật cho driver
- **Lỗi:** Khi admin sửa chuyến đi, driver không thấy cập nhật mới.
- **Cách sửa:** Backend gửi WebSocket notification tới driver khi admin sửa chuyến đi. Frontend driver lắng nghe và refetch lại trip_plan khi có thông báo.

## 4. Sửa chuyến đi bị null dữ liệu
- **Lỗi:** Khi admin sửa chuyến đi, chỉ gửi một phần thông tin (driverId, notes), các trường khác bị null trong DB.
- **Cách sửa:** Khi cập nhật phải gửi đầy đủ thông tin trip_plan (driver, vehicle, origin, destination, ...), không chỉ gửi mỗi driverId và notes.

## 5. Payload cập nhật chuyến đi thiếu trường
- **Lỗi:** Payload gửi lên backend khi sửa chỉ có vài trường, các trường khác null.
- **Cách sửa:** Khi submit cập nhật, gửi object đầy đủ các trường giống như khi tạo chuyến đi.

## 6. Kết thúc chuyến đi bị mất thông tin tài xế, xe, điểm đi
- **Lỗi:** Sau khi nhấn "KẾT THÚC CHUYẾN ĐI", admin thấy các trường bị N/A.
- **Cách sửa:** Khi kết thúc chuyến đi, lấy lại toàn bộ thông tin trip_plan hiện tại, chỉ đổi status thành 'COMPLETED' và gửi lên backend.

## 7. Kết thúc chuyến đi không tự động cập nhật cho admin
- **Lỗi:** Sau khi driver kết thúc chuyến đi, admin phải F5 mới thấy trạng thái mới.
- **Cách sửa:** Backend gửi WebSocket notification tới /topic/admin-realtime khi trạng thái trip_plan đổi thành COMPLETED. Frontend admin lắng nghe và tự động reload danh sách chuyến đi.

## 8. Xác nhận chuyến đi phải F5 mới enable nút "ĐI"
- **Lỗi:** Sau khi nhấn "Nhận chuyến", phải F5 mới bấm được "ĐI".
- **Cách sửa:** Sau khi xác nhận chuyến đi, refetch lại trip_plan và cập nhật state (confirmed, tripId, currentLeg, ...), giúp nút "ĐI" được enable ngay.

## 9. Lỗi fetch trip_plan trả về rỗng gây lỗi JSON
- **Lỗi:** Khi kết thúc chuyến đi, nếu fetch trip_plan trả về rỗng sẽ lỗi "Unexpected end of JSON input".
- **Cách sửa:** Kiểm tra response trước khi gọi .json(), nếu rỗng thì báo lỗi hợp lý.

---
**Tóm lại:**
- Luôn gửi đầy đủ thông tin khi cập nhật trip_plan.
- Luôn refetch lại dữ liệu sau các thao tác thay đổi trạng thái.
- Sử dụng WebSocket để đồng bộ realtime giữa driver và admin.
- Xử lý an toàn response từ backend để tránh lỗi frontend. 