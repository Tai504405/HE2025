package com.example.ridesharing.controller;

import com.example.ridesharing.model.*;
import com.example.ridesharing.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/trips")
@CrossOrigin(origins = "*")
public class AdminTripController {

    @Autowired
    private BusTripRepository busTripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BusScheduleRepository busScheduleRepository;

    @Autowired
    private BusRouteRepository busRouteRepository;

    @Autowired
    private BusStationRepository busStationRepository;

    @Autowired
    private TripRegistrationRepository tripRegistrationRepository;

    // 1. Xem danh sách tất cả chuyến đi với bộ lọc
    @GetMapping("")
    public ResponseEntity<?> getAllTrips(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String timeSlot, // Sáng, Trưa, Chiều
            @RequestParam(required = false) Long driverId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) String status) {

        List<BusTrip> allTrips = busTripRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (BusTrip trip : allTrips) {
            // Lọc theo ngày
            if (date != null && trip.getStartedAt() != null) {
                if (!trip.getStartedAt().toLocalDate().toString().equals(date)) {
                    continue;
                }
            }

            // Lọc theo ca
            if (timeSlot != null && trip.getSchedule() != null) {
                if (!timeSlot.equals(trip.getSchedule().getType())) {
                    continue;
                }
            }

            // Lọc theo tài xế
            if (driverId != null && trip.getDriver() != null) {
                if (!driverId.equals(trip.getDriver().getId())) {
                    continue;
                }
            }

            // Lọc theo xe
            if (vehicleId != null && trip.getVehicle() != null) {
                if (!vehicleId.equals(trip.getVehicle().getId())) {
                    continue;
                }
            }

            // Lọc theo trạng thái
            if (status != null) {
                if (!status.equals(trip.getStatus())) {
                    continue;
                }
            }

            Map<String, Object> tripInfo = new HashMap<>();
            tripInfo.put("id", trip.getId());
            tripInfo.put("schedule", trip.getSchedule());
            tripInfo.put("driver", trip.getDriver());
            tripInfo.put("vehicle", trip.getVehicle());
            tripInfo.put("status", trip.getStatus());
            tripInfo.put("currentStation", trip.getCurrentStation());
            tripInfo.put("seatsTotal", trip.getSeatsTotal());
            tripInfo.put("seatsAvailable", trip.getSeatsAvailable());
            tripInfo.put("startedAt", trip.getStartedAt());
            tripInfo.put("endedAt", trip.getEndedAt());
            tripInfo.put("currentLat", trip.getCurrentLat());
            tripInfo.put("currentLng", trip.getCurrentLng());
            tripInfo.put("currentStatus", trip.getCurrentStatus());

            // Tính số người đăng ký
            List<TripRegistration> registrations = tripRegistrationRepository.findAll()
                    .stream()
                    .filter(tr -> tr.getTrip().getId().equals(trip.getId()))
                    .collect(Collectors.toList());
            tripInfo.put("registeredCount", registrations.size());

            result.add(tripInfo);
        }

        return ResponseEntity.ok(result);
    }

    // 2. Tạo chuyến đi mới
    @PostMapping("")
    public ResponseEntity<?> createTrip(@RequestBody Map<String, Object> tripData) {
        try {
            // Kiểm tra dữ liệu đầu vào
            Long scheduleId = Long.valueOf(tripData.get("scheduleId").toString());
            Long driverId = Long.valueOf(tripData.get("driverId").toString());
            Long vehicleId = Long.valueOf(tripData.get("vehicleId").toString());
            String notes = (String) tripData.get("notes");

            // Lấy thông tin từ database
            Optional<BusSchedule> scheduleOpt = busScheduleRepository.findById(scheduleId);
            Optional<User> driverOpt = userRepository.findById(driverId);
            Optional<Vehicle> vehicleOpt = vehicleRepository.findById(vehicleId);

            if (scheduleOpt.isEmpty() || driverOpt.isEmpty() || vehicleOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Thông tin không hợp lệ");
            }

            BusSchedule schedule = scheduleOpt.get();
            User driver = driverOpt.get();
            Vehicle vehicle = vehicleOpt.get();

            // Kiểm tra xung đột lịch xe
            List<BusTrip> vehicleConflicts = busTripRepository.findAll()
                    .stream()
                    .filter(trip -> trip.getVehicle().getId().equals(vehicleId) &&
                            trip.getStatus().equals("WAITING") || trip.getStatus().equals("BOARDING")
                            || trip.getStatus().equals("RUNNING"))
                    .collect(Collectors.toList());

            if (!vehicleConflicts.isEmpty()) {
                return ResponseEntity.badRequest().body("Xe đã được gán cho chuyến khác");
            }

            // Kiểm tra xung đột lịch tài xế
            List<BusTrip> driverConflicts = busTripRepository.findAll()
                    .stream()
                    .filter(trip -> trip.getDriver().getId().equals(driverId) &&
                            trip.getStatus().equals("WAITING") || trip.getStatus().equals("BOARDING")
                            || trip.getStatus().equals("RUNNING"))
                    .collect(Collectors.toList());

            if (!driverConflicts.isEmpty()) {
                return ResponseEntity.badRequest().body("Tài xế đã có chuyến đi khác");
            }

            // Tạo chuyến đi mới
            BusTrip newTrip = new BusTrip();
            newTrip.setSchedule(schedule);
            newTrip.setDriver(driver);
            newTrip.setVehicle(vehicle);
            newTrip.setStatus("WAITING");
            newTrip.setSeatsTotal(vehicle.getSeats());
            newTrip.setSeatsAvailable(vehicle.getSeats());
            newTrip.setCurrentStatus("IDLE");
            newTrip.setStartedAt(LocalDateTime.now());
            newTrip.setNotes(notes);

            BusTrip savedTrip = busTripRepository.save(newTrip);

            return ResponseEntity.ok(savedTrip);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo chuyến đi: " + e.getMessage());
        }
    }

    // 3. Chỉnh sửa chuyến đi
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrip(@PathVariable Long id, @RequestBody Map<String, Object> tripData) {
        try {
            Optional<BusTrip> tripOpt = busTripRepository.findById(id);
            if (tripOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            BusTrip trip = tripOpt.get();

            // Kiểm tra nếu chuyến đã bắt đầu thì không cho sửa
            if (trip.getStatus().equals("RUNNING") || trip.getStatus().equals("FINISHED")) {
                return ResponseEntity.badRequest().body("Không thể sửa chuyến đã bắt đầu hoặc kết thúc");
            }

            // Cập nhật thông tin
            if (tripData.containsKey("scheduleId")) {
                Long scheduleId = Long.valueOf(tripData.get("scheduleId").toString());
                Optional<BusSchedule> scheduleOpt = busScheduleRepository.findById(scheduleId);
                if (scheduleOpt.isPresent()) {
                    trip.setSchedule(scheduleOpt.get());
                }
            }

            if (tripData.containsKey("driverId")) {
                Long driverId = Long.valueOf(tripData.get("driverId").toString());
                Optional<User> driverOpt = userRepository.findById(driverId);
                if (driverOpt.isPresent()) {
                    // Kiểm tra xung đột tài xế
                    List<BusTrip> driverConflicts = busTripRepository.findAll()
                            .stream()
                            .filter(t -> t.getDriver().getId().equals(driverId) &&
                                    !t.getId().equals(id) &&
                                    (t.getStatus().equals("WAITING") || t.getStatus().equals("BOARDING")
                                            || t.getStatus().equals("RUNNING")))
                            .collect(Collectors.toList());

                    if (!driverConflicts.isEmpty()) {
                        return ResponseEntity.badRequest().body("Tài xế đã có chuyến đi khác");
                    }
                    trip.setDriver(driverOpt.get());
                }
            }

            if (tripData.containsKey("vehicleId")) {
                Long vehicleId = Long.valueOf(tripData.get("vehicleId").toString());
                Optional<Vehicle> vehicleOpt = vehicleRepository.findById(vehicleId);
                if (vehicleOpt.isPresent()) {
                    // Kiểm tra xung đột xe
                    List<BusTrip> vehicleConflicts = busTripRepository.findAll()
                            .stream()
                            .filter(t -> t.getVehicle().getId().equals(vehicleId) &&
                                    !t.getId().equals(id) &&
                                    (t.getStatus().equals("WAITING") || t.getStatus().equals("BOARDING")
                                            || t.getStatus().equals("RUNNING")))
                            .collect(Collectors.toList());

                    if (!vehicleConflicts.isEmpty()) {
                        return ResponseEntity.badRequest().body("Xe đã được gán cho chuyến khác");
                    }
                    trip.setVehicle(vehicleOpt.get());
                    trip.setSeatsTotal(vehicleOpt.get().getSeats());
                    trip.setSeatsAvailable(vehicleOpt.get().getSeats());
                }
            }

            if (tripData.containsKey("status")) {
                trip.setStatus((String) tripData.get("status"));
            }

            if (tripData.containsKey("notes")) {
                trip.setNotes((String) tripData.get("notes"));
            }

            BusTrip updatedTrip = busTripRepository.save(trip);

            // Gửi thông báo đến người đăng ký
            sendNotificationToRegistrations(trip.getId(), "Chuyến đi đã được cập nhật");

            return ResponseEntity.ok(updatedTrip);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật chuyến đi: " + e.getMessage());
        }
    }

    // 4. Xóa chuyến đi
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTrip(@PathVariable Long id) {
        try {
            Optional<BusTrip> tripOpt = busTripRepository.findById(id);
            if (tripOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            BusTrip trip = tripOpt.get();

            // Kiểm tra nếu chuyến đã bắt đầu thì không cho xóa
            if (trip.getStatus().equals("RUNNING") || trip.getStatus().equals("FINISHED")) {
                return ResponseEntity.badRequest().body("Không thể xóa chuyến đã bắt đầu hoặc kết thúc");
            }

            // Gửi thông báo đến người đăng ký trước khi xóa
            sendNotificationToRegistrations(trip.getId(), "Chuyến đi đã bị hủy");

            // Xóa các đăng ký liên quan
            List<TripRegistration> registrations = tripRegistrationRepository.findAll()
                    .stream()
                    .filter(tr -> tr.getTrip().getId().equals(id))
                    .collect(Collectors.toList());
            tripRegistrationRepository.deleteAll(registrations);

            // Xóa chuyến đi
            busTripRepository.deleteById(id);

            return ResponseEntity.ok("Đã xóa chuyến đi thành công");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xóa chuyến đi: " + e.getMessage());
        }
    }

    // 5. Gán hoặc thay đổi xe
    @PutMapping("/{id}/vehicle")
    public ResponseEntity<?> assignVehicle(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Long vehicleId = Long.valueOf(data.get("vehicleId").toString());

            Optional<BusTrip> tripOpt = busTripRepository.findById(id);
            Optional<Vehicle> vehicleOpt = vehicleRepository.findById(vehicleId);

            if (tripOpt.isEmpty() || vehicleOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Thông tin không hợp lệ");
            }

            BusTrip trip = tripOpt.get();
            Vehicle vehicle = vehicleOpt.get();

            // Kiểm tra xung đột xe
            List<BusTrip> vehicleConflicts = busTripRepository.findAll()
                    .stream()
                    .filter(t -> t.getVehicle().getId().equals(vehicleId) &&
                            !t.getId().equals(id) &&
                            (t.getStatus().equals("WAITING") || t.getStatus().equals("BOARDING")
                                    || t.getStatus().equals("RUNNING")))
                    .collect(Collectors.toList());

            if (!vehicleConflicts.isEmpty()) {
                return ResponseEntity.badRequest().body("Xe đã được gán cho chuyến khác");
            }

            trip.setVehicle(vehicle);
            trip.setSeatsTotal(vehicle.getSeats());
            trip.setSeatsAvailable(vehicle.getSeats());

            BusTrip updatedTrip = busTripRepository.save(trip);

            // Gửi thông báo
            sendNotificationToRegistrations(trip.getId(), "Xe đã được thay đổi");

            return ResponseEntity.ok(updatedTrip);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi gán xe: " + e.getMessage());
        }
    }

    // 6. Gán hoặc thay đổi tài xế
    @PutMapping("/{id}/driver")
    public ResponseEntity<?> assignDriver(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Long driverId = Long.valueOf(data.get("driverId").toString());

            Optional<BusTrip> tripOpt = busTripRepository.findById(id);
            Optional<User> driverOpt = userRepository.findById(driverId);

            if (tripOpt.isEmpty() || driverOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Thông tin không hợp lệ");
            }

            BusTrip trip = tripOpt.get();
            User driver = driverOpt.get();

            // Kiểm tra role tài xế
            if (!driver.getRole().equals("DRIVER")) {
                return ResponseEntity.badRequest().body("Người dùng không phải tài xế");
            }

            // Kiểm tra xung đột tài xế
            List<BusTrip> driverConflicts = busTripRepository.findAll()
                    .stream()
                    .filter(t -> t.getDriver().getId().equals(driverId) &&
                            !t.getId().equals(id) &&
                            (t.getStatus().equals("WAITING") || t.getStatus().equals("BOARDING")
                                    || t.getStatus().equals("RUNNING")))
                    .collect(Collectors.toList());

            if (!driverConflicts.isEmpty()) {
                return ResponseEntity.badRequest().body("Tài xế đã có chuyến đi khác");
            }

            trip.setDriver(driver);
            BusTrip updatedTrip = busTripRepository.save(trip);

            // Gửi thông báo
            sendNotificationToRegistrations(trip.getId(), "Tài xế đã được thay đổi");

            return ResponseEntity.ok(updatedTrip);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi gán tài xế: " + e.getMessage());
        }
    }

    // 7. Theo dõi số lượng người đăng ký chuyến
    @GetMapping("/{id}/registrations")
    public ResponseEntity<?> getTripRegistrations(@PathVariable Long id) {
        try {
            Optional<BusTrip> tripOpt = busTripRepository.findById(id);
            if (tripOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            BusTrip trip = tripOpt.get();
            List<TripRegistration> registrations = tripRegistrationRepository.findAll()
                    .stream()
                    .filter(tr -> tr.getTrip().getId().equals(id))
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("trip", trip);
            result.put("registrations", registrations);
            result.put("registeredCount", registrations.size());
            result.put("availableSeats", trip.getSeatsAvailable());
            result.put("isFull", trip.getSeatsAvailable() <= 0);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi lấy thông tin đăng ký: " + e.getMessage());
        }
    }

    // 8. Khóa/mở khóa đăng ký chuyến
    @PutMapping("/{id}/lock-registration")
    public ResponseEntity<?> toggleRegistrationLock(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        try {
            Boolean lock = (Boolean) data.get("lock");

            Optional<BusTrip> tripOpt = busTripRepository.findById(id);
            if (tripOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            BusTrip trip = tripOpt.get();
            trip.setRegistrationLocked(lock);
            BusTrip updatedTrip = busTripRepository.save(trip);

            String message = lock ? "Đăng ký đã bị khóa" : "Đăng ký đã được mở khóa";
            sendNotificationToRegistrations(trip.getId(), message);

            return ResponseEntity.ok(updatedTrip);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi thay đổi trạng thái khóa: " + e.getMessage());
        }
    }

    // 9. Xuất báo cáo chuyến đi
    @GetMapping("/report")
    public ResponseEntity<?> generateTripReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long driverId) {

        try {
            List<BusTrip> allTrips = busTripRepository.findAll();
            List<Map<String, Object>> report = new ArrayList<>();

            for (BusTrip trip : allTrips) {
                // Lọc theo ngày
                if (startDate != null && trip.getStartedAt() != null) {
                    if (trip.getStartedAt().toLocalDate().toString().compareTo(startDate) < 0) {
                        continue;
                    }
                }
                if (endDate != null && trip.getStartedAt() != null) {
                    if (trip.getStartedAt().toLocalDate().toString().compareTo(endDate) > 0) {
                        continue;
                    }
                }

                // Lọc theo tài xế
                if (driverId != null && trip.getDriver() != null) {
                    if (!driverId.equals(trip.getDriver().getId())) {
                        continue;
                    }
                }

                // Đếm số đăng ký
                List<TripRegistration> registrations = tripRegistrationRepository.findAll()
                        .stream()
                        .filter(tr -> tr.getTrip().getId().equals(trip.getId()))
                        .collect(Collectors.toList());

                Map<String, Object> tripReport = new HashMap<>();
                tripReport.put("tripId", trip.getId());
                tripReport.put("driverName", trip.getDriver() != null ? trip.getDriver().getName() : "N/A");
                tripReport.put("vehicleCode", trip.getVehicle() != null ? trip.getVehicle().getVehicleCode() : "N/A");
                tripReport.put("startTime", trip.getStartedAt());
                tripReport.put("endTime", trip.getEndedAt());
                tripReport.put("status", trip.getStatus());
                tripReport.put("totalSeats", trip.getSeatsTotal());
                tripReport.put("availableSeats", trip.getSeatsAvailable());
                tripReport.put("registeredCount", registrations.size());
                tripReport.put("occupancyRate",
                        trip.getSeatsTotal() > 0
                                ? (double) (trip.getSeatsTotal() - trip.getSeatsAvailable()) / trip.getSeatsTotal()
                                        * 100
                                : 0);

                report.add(tripReport);
            }

            return ResponseEntity.ok(report);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo báo cáo: " + e.getMessage());
        }
    }

    // Helper method để gửi thông báo
    private void sendNotificationToRegistrations(Long tripId, String message) {
        try {
            List<TripRegistration> registrations = tripRegistrationRepository.findAll()
                    .stream()
                    .filter(tr -> tr.getTrip().getId().equals(tripId))
                    .collect(Collectors.toList());

            for (TripRegistration registration : registrations) {
                // Ở đây có thể tích hợp với hệ thống thông báo
                // Ví dụ: gửi email, push notification, SMS...
                System.out.println("Thông báo cho " + registration.getUser().getEmail() + ": " + message);
            }
        } catch (Exception e) {
            System.err.println("Lỗi gửi thông báo: " + e.getMessage());
        }
    }
}