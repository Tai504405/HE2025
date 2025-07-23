package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusTrip;
import com.example.ridesharing.model.BusStation;
import com.example.ridesharing.repository.BusTripRepository;
import com.example.ridesharing.repository.BusStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.time.LocalDateTime;
import com.example.ridesharing.model.User;
import com.example.ridesharing.repository.UserRepository;

@RestController
@RequestMapping("/api/driver")
public class DriverTripController {
    @Autowired
    private BusTripRepository busTripRepository;
    @Autowired
    private BusStationRepository busStationRepository;
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/trips/{driverId}")
    public List<BusTrip> getTripsByDriver(@PathVariable Long driverId) {
        return busTripRepository.findAll().stream()
                .filter(t -> t.getDriver() != null && t.getDriver().getId().equals(driverId))
                .toList();
    }

    @PostMapping("/trip/start")
    public ResponseEntity<?> startNewTrip(@RequestBody Map<String, Object> body) {
        Long driverId = body.get("driverId") != null ? Long.valueOf(body.get("driverId").toString()) : null;
        if (driverId == null)
            return ResponseEntity.badRequest().body("Thiếu driverId");
        User driver = userRepository.findById(driverId).orElse(null);
        if (driver == null)
            return ResponseEntity.badRequest().body("Driver not found");
        BusTrip trip = new BusTrip();
        trip.setDriver(driver); // PHẢI lấy từ DB, không được new User()
        trip.setStatus("WAITING");
        trip.setSeatsTotal(30);
        trip.setSeatsAvailable(30);
        trip.setCurrentStatus("READY");
        trip.setCurrentLat(10.8098468); // U mặc định
        trip.setCurrentLng(106.7149365);
        trip.setStartedAt(LocalDateTime.now());
        BusTrip saved = busTripRepository.save(trip);
        return ResponseEntity.ok(Map.of("tripId", saved.getId()));
    }

    @PostMapping("/{driverId}/start-trip")
    public ResponseEntity<?> startOrGetTrip(@PathVariable Long driverId) {
        // Kiểm tra nếu đã có trip chưa kết thúc
        List<BusTrip> existing = busTripRepository.findAll().stream()
                .filter(t -> t.getDriver() != null && t.getDriver().getId().equals(driverId))
                .filter(t -> {
                    String status = t.getStatus();
                    // Chỉ coi là chưa kết thúc nếu status là MOVING, WAITING, READY, BOARDING
                    return "MOVING".equals(status) || "WAITING".equals(status) || "READY".equals(status)
                            || "BOARDING".equals(status);
                })
                .toList();
        System.out.println("Số trip chưa kết thúc cho driverId=" + driverId + ": " + existing.size());
        if (!existing.isEmpty()) {
            return ResponseEntity.ok(existing.get(0)); // Trả về trip đang chạy
        }
        // Tạo trip mới
        User driver = userRepository.findById(driverId).orElse(null);
        if (driver == null)
            return ResponseEntity.badRequest().body("Driver not found");
        BusTrip trip = new BusTrip();
        trip.setDriver(driver); // PHẢI lấy từ DB, không được new User()
        trip.setStatus("CREATED");
        trip.setCurrentStatus("READY");
        trip.setSeatsTotal(30);
        trip.setSeatsAvailable(30);
        trip.setCurrentLat(10.8098468); // U mặc định
        trip.setCurrentLng(106.7149365);
        trip.setStartedAt(LocalDateTime.now());
        busTripRepository.save(trip);
        System.out.println("Tạo trip mới cho driverId=" + driverId + ", tripId=" + trip.getId());
        return ResponseEntity.ok(trip);
    }

    @PostMapping("/trips/{tripId}/start")
    public ResponseEntity<?> startTrip(@PathVariable Long tripId) {
        Optional<BusTrip> tripOpt = busTripRepository.findById(tripId);
        if (tripOpt.isEmpty())
            return ResponseEntity.notFound().build();
        BusTrip trip = tripOpt.get();
        trip.setStatus("BOARDING");
        busTripRepository.save(trip);
        return ResponseEntity.ok(trip);
    }

    @PostMapping("/trips/{tripId}/station")
    public ResponseEntity<?> confirmStation(@PathVariable Long tripId, @RequestBody BusStation station) {
        Optional<BusTrip> tripOpt = busTripRepository.findById(tripId);
        Optional<BusStation> stationOpt = busStationRepository.findById(station.getId());
        if (tripOpt.isEmpty() || stationOpt.isEmpty())
            return ResponseEntity.badRequest().body("Không tìm thấy chuyến hoặc trạm");
        BusTrip trip = tripOpt.get();
        trip.setCurrentStation(stationOpt.get());
        busTripRepository.save(trip);
        return ResponseEntity.ok(trip);
    }
}