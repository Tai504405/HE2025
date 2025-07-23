package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusTrip;
import com.example.ridesharing.repository.BusTripRepository;
import com.example.ridesharing.repository.TripPlanRepository;
import com.example.ridesharing.model.TripPlan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/realtime")
public class RealtimeController {
    @Autowired
    private BusTripRepository busTripRepository;

    @Autowired
    private TripPlanRepository tripPlanRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Lưu trạng thái realtime cho nhiều driver (in-memory)
    private final Map<Long, Map<String, Object>> driverStates = new ConcurrentHashMap<>();
    // Lưu lịch sử trạng thái cho từng driver (in-memory)
    private final Map<Long, List<Map<String, Object>>> driverLogs = new ConcurrentHashMap<>();

    @GetMapping("/drivers")
    public ResponseEntity<?> getAllDriverStates() {
        // Xóa các driver không hoạt động (quá 30 giây)
        long currentTime = System.currentTimeMillis();
        driverStates.entrySet().removeIf(entry -> {
            Map<String, Object> state = entry.getValue();
            Long lastActive = (Long) state.get("lastActive");
            return lastActive != null && (currentTime - lastActive) > 30000; // 30 giây
        });
        // Bổ sung origin từ TripPlan CONFIRMED
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> state : driverStates.values()) {
            Object driverIdObj = state.get("driverId");
            if (driverIdObj != null) {
                try {
                    Long driverId = Long.valueOf(driverIdObj.toString());
                    List<TripPlan> plans = tripPlanRepository.findByDriverIdAndStatusIn(driverId,
                            java.util.Arrays.asList("CONFIRMED"));
                    if (!plans.isEmpty()) {
                        // Lấy origin mới nhất từ TripPlan CONFIRMED
                        state.put("origin", plans.get(0).getOrigin());
                    } else {
                        state.remove("origin");
                    }
                } catch (Exception ignore) {
                }
            }
            result.add(state);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/driver/{driverId}/history")
    public ResponseEntity<?> getDriverHistory(@PathVariable Long driverId) {
        return ResponseEntity.ok(driverLogs.getOrDefault(driverId, List.of()));
    }

    @GetMapping("/trip/{tripId}/location")
    public ResponseEntity<?> getTripLocation(@PathVariable Long tripId) {
        Optional<BusTrip> tripOpt = busTripRepository.findById(tripId);
        if (tripOpt.isEmpty())
            return ResponseEntity.notFound().build();
        BusTrip trip = tripOpt.get();
        return ResponseEntity.ok(Map.of(
                "latitude", trip.getCurrentLat() != null ? trip.getCurrentLat() : 0,
                "longitude", trip.getCurrentLng() != null ? trip.getCurrentLng() : 0,
                "status", trip.getCurrentStatus() != null ? trip.getCurrentStatus() : "IDLE"));
    }

    @PostMapping("/trip/{tripId}/location")
    public ResponseEntity<?> updateTripLocation(@PathVariable Long tripId, @RequestBody Map<String, Object> body) {
        Optional<BusTrip> tripOpt = busTripRepository.findById(tripId);
        if (tripOpt.isEmpty())
            return ResponseEntity.notFound().build();
        BusTrip trip = tripOpt.get();
        if (body.containsKey("latitude"))
            trip.setCurrentLat(Double.valueOf(body.get("latitude").toString()));
        if (body.containsKey("longitude"))
            trip.setCurrentLng(Double.valueOf(body.get("longitude").toString()));
        if (body.containsKey("status"))
            trip.setCurrentStatus(body.get("status").toString());
        busTripRepository.save(trip);
        // Lưu trạng thái realtime cho driver này
        Map<String, Object> state = new HashMap<>();
        state.put("tripId", tripId);
        state.put("latitude", trip.getCurrentLat());
        state.put("longitude", trip.getCurrentLng());
        state.put("status", trip.getCurrentStatus());
        state.put("driverId", trip.getDriver() != null ? trip.getDriver().getId() : null);
        state.put("driverName", trip.getDriver() != null ? trip.getDriver().getName() : ("Tài xế " + tripId));
        state.put("lastActive", System.currentTimeMillis());
        Long driverId = trip.getDriver() != null ? trip.getDriver().getId() : null;
        if (driverId != null) {
            driverStates.put(driverId, state);
            driverLogs.putIfAbsent(driverId, new ArrayList<>());
            driverLogs.get(driverId).add(new HashMap<>(state));
        }
        // Broadcast toàn bộ danh sách driver qua WebSocket
        messagingTemplate.convertAndSend("/topic/bus-location", driverStates.values());
        // Broadcast cho admin
        messagingTemplate.convertAndSend("/topic/admin-realtime", "reload");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/trip/{tripId}/end")
    public ResponseEntity<?> endTrip(@PathVariable Long tripId) {
        // Xóa driver khỏi danh sách realtime
        // Tìm driverId từ trip
        Optional<BusTrip> tripOpt = busTripRepository.findById(tripId);
        if (tripOpt.isPresent()) {
            BusTrip trip = tripOpt.get();
            Long driverId = trip.getDriver() != null ? trip.getDriver().getId() : null;
            if (driverId != null)
                driverStates.remove(driverId);
            trip.setCurrentStatus("ENDED");
            trip.setStatus("FINISHED");
            trip.setEndedAt(LocalDateTime.now());
            busTripRepository.save(trip);
        }
        // Broadcast cập nhật cho tất cả client
        messagingTemplate.convertAndSend("/topic/bus-location", driverStates.values());
        return ResponseEntity.ok().build();
    }

    // API để xóa driver khỏi danh sách realtime (khi đóng tab hoặc mất kết nối)
    @DeleteMapping("/trip/{tripId}")
    public ResponseEntity<?> removeTrip(@PathVariable Long tripId) {
        // Xóa driver khỏi danh sách realtime
        Optional<BusTrip> tripOpt = busTripRepository.findById(tripId);
        if (tripOpt.isPresent()) {
            BusTrip trip = tripOpt.get();
            Long driverId = trip.getDriver() != null ? trip.getDriver().getId() : null;
            if (driverId != null)
                driverStates.remove(driverId);
        }
        // Broadcast cập nhật cho tất cả client
        messagingTemplate.convertAndSend("/topic/bus-location", driverStates.values());
        return ResponseEntity.ok().build();
    }
}