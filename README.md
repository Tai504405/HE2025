# Hướng dẫn cài đặt & chạy hệ thống Bus Realtime

## 1. Yêu cầu hệ thống
- **Java 17+** (JDK, để chạy Spring Boot backend)
- **Node.js + npm** (để chạy React frontend)
- **Maven** (nếu không dùng wrapper `mvnw`)
- **Docker** (để chạy OSRM routing server cho bản đồ)
- **Git** (nếu clone từ repo)

## 2. Clone code
```sh
git clone <link-repo>
```
Hoặc copy toàn bộ source code sang máy bạn.

## 3. Backend (Spring Boot)
1. **Cài Java 17+**
2. **Cài Maven** (nếu không dùng `./mvnw`)
3. **Chạy backend:**
   ```sh
   cd ridesharing
   ./mvnw spring-boot:run
   # hoặc nếu đã cài Maven:
   mvn spring-boot:run
   ```
   - Backend sẽ chạy ở `http://localhost:8080`

## 4. Frontend (React)
1. **Cài Node.js + npm**
2. **Cài dependencies:**
   ```sh
   cd ridesharing-frontend
   npm install
   ```
3. **Chạy frontend:**
   ```sh
   npm start
   ```
   - Frontend sẽ chạy ở `http://localhost:3000`

## 5. OSRM Routing Server (bản đồ)
1. **Cài Docker**
2. **Tải file bản đồ OSM (ví dụ: vietnam-latest.osm.pbf)**
3. **Chạy OSRM bằng Docker:**
   ```sh
   # Chuẩn bị file .osrm (chỉ cần làm 1 lần)
   docker run -t -v ${PWD}:/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/vietnam-latest.osm.pbf
   docker run -t -v ${PWD}:/data osrm/osrm-backend osrm-partition /data/vietnam-latest.osrm
   docker run -t -v ${PWD}:/data osrm/osrm-backend osrm-backend osrm-customize /data/vietnam-latest.osrm
   # Chạy server
   docker run -t -i -p 5000:5000 -v ${PWD}:/data osrm/osrm-backend osrm-routed --algorithm mld /data/vietnam-latest.osrm
   ```
   - OSRM sẽ chạy ở `http://localhost:5000`

## 6. Cấu hình khác
- Nếu backend và frontend chạy trên các port khác nhau, đảm bảo backend đã bật CORS hoặc frontend đã cấu hình proxy.
- Nếu dùng SQL Server, cần chỉnh lại `application.properties` cho đúng thông tin database.

## 7. Sử dụng
- Truy cập `http://localhost:3000` để sử dụng hệ thống.
- Đăng nhập tài khoản driver, user, admin để test các chức năng.

---
**Nếu gặp lỗi hoặc cần hỗ trợ, hãy liên hệ người phát triển hoặc kiểm tra lại các bước cài đặt trên.** 