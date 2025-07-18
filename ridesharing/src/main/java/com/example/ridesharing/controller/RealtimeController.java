package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusTrip;
import com.example.ridesharing.repository.BusTripRepository;
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
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/realtime")
public class RealtimeController {
    @Autowired
    private BusTripRepository busTripRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Lưu trạng thái realtime cho nhiều driver (in-memory)
    private final Map<Long, Map<String, Object>> driverStates = new ConcurrentHashMap<>();
    // Lưu lịch sử trạng thái cho từng driver (in-memory)
    private final Map<Long, List<Map<String, Object>>> driverLogs = new ConcurrentHashMap<>();

    @GetMapping("/drivers")
    public ResponseEntity<?> getAllDriverStates() {
        return ResponseEntity.ok(driverStates.values());
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
        driverStates.put(tripId, state);
        // Lưu log lịch sử
        Long driverId = trip.getDriver() != null ? trip.getDriver().getId() : null;
        if (driverId != null) {
            driverLogs.putIfAbsent(driverId, new ArrayList<>());
            driverLogs.get(driverId).add(new HashMap<>(state));
        }
        // Broadcast toàn bộ danh sách driver qua WebSocket
        messagingTemplate.convertAndSend("/topic/bus-location", driverStates.values());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/trip/{tripId}/end")
    public ResponseEntity<?> endTrip(@PathVariable Long tripId) {
        driverStates.remove(tripId);
        messagingTemplate.convertAndSend("/topic/bus-location", driverStates.values());
        return ResponseEntity.ok().build();
    }
}