package com.example.ridesharing.controller;

import com.example.ridesharing.model.TripPlan;
import com.example.ridesharing.repository.TripPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;
import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/trip-plans")
@CrossOrigin(origins = "*")
public class TripPlanController {
    @Autowired
    private TripPlanRepository tripPlanRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("")
    public List<TripPlan> getAllTripPlans() {
        return tripPlanRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripPlan> getTripPlanById(@PathVariable Long id) {
        Optional<TripPlan> tripPlan = tripPlanRepository.findById(id);
        return tripPlan.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("")
    public ResponseEntity<?> createTripPlan(@RequestBody TripPlan tripPlan) {
        if (tripPlan.getDriver() != null && tripPlan.getDriver().getId() != null) {
            List<TripPlan> existing = tripPlanRepository.findByDriverIdAndStatusIn(
                    tripPlan.getDriver().getId(), Arrays.asList("CREATED", "CONFIRMED"));
            if (!existing.isEmpty()) {
                return ResponseEntity.badRequest().body("Tài xế này đang có chuyến đi chưa hoàn thành!");
            }
        }
        TripPlan saved = tripPlanRepository.save(tripPlan);
        // Gửi notify cho tài xế
        if (saved.getDriver() != null && saved.getDriver().getId() != null) {
            messagingTemplate.convertAndSend("/topic/driver-notify/" + saved.getDriver().getId(),
                    "Bạn có chuyến đi mới, hãy nhận chuyến!");
        }
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripPlan> updateTripPlan(@PathVariable Long id, @RequestBody TripPlan updated) {
        Optional<TripPlan> tripPlanOpt = tripPlanRepository.findById(id);
        if (tripPlanOpt.isEmpty())
            return ResponseEntity.notFound().build();
        TripPlan tripPlan = tripPlanOpt.get();
        // Cập nhật các trường cần thiết
        tripPlan.setDriver(updated.getDriver());
        tripPlan.setVehicle(updated.getVehicle());
        tripPlan.setOrigin(updated.getOrigin());
        tripPlan.setDestination(updated.getDestination());
        tripPlan.setOriginLat(updated.getOriginLat());
        tripPlan.setOriginLng(updated.getOriginLng());
        tripPlan.setDestinationLat(updated.getDestinationLat());
        tripPlan.setDestinationLng(updated.getDestinationLng());
        tripPlan.setStatus(updated.getStatus());
        tripPlan.setStartedAt(updated.getStartedAt());
        tripPlan.setEndedAt(updated.getEndedAt());
        tripPlan.setNotes(updated.getNotes());
        TripPlan saved = tripPlanRepository.save(tripPlan);
        // Gửi notify cho driver nếu có driverId
        if (saved.getDriver() != null && saved.getDriver().getId() != null) {
            messagingTemplate.convertAndSend("/topic/driver-notify/" + saved.getDriver().getId(),
                    "Chuyến đi của bạn đã được cập nhật. Vui lòng kiểm tra lại!");
        }
        // Nếu trạng thái là COMPLETED thì gửi notify cho admin
        if ("COMPLETED".equals(saved.getStatus())) {
            messagingTemplate.convertAndSend("/topic/admin-realtime", "reload");
        }
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmTrip(@PathVariable Long id) {
        Optional<TripPlan> tripOpt = tripPlanRepository.findById(id);
        if (tripOpt.isEmpty())
            return ResponseEntity.notFound().build();
        TripPlan trip = tripOpt.get();
        trip.setDriverConfirmed(true);
        trip.setStatus("CONFIRMED");
        tripPlanRepository.save(trip);
        // Gửi thông báo realtime cho tất cả client để cập nhật bản đồ
        messagingTemplate.convertAndSend("/topic/bus-location", "reload");
        return ResponseEntity.ok("Đã xác nhận chuyến đi");
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelTrip(@PathVariable Long id) {
        Optional<TripPlan> tripOpt = tripPlanRepository.findById(id);
        if (tripOpt.isEmpty())
            return ResponseEntity.notFound().build();
        TripPlan trip = tripOpt.get();
        trip.setDriverConfirmed(false);
        trip.setStatus("CANCELLED");
        tripPlanRepository.save(trip);
        return ResponseEntity.ok("Đã hủy chuyến đi");
    }

    @PostMapping("/{id}/update-origin")
    public ResponseEntity<?> updateOrigin(@PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        Optional<TripPlan> tripOpt = tripPlanRepository.findById(id);
        if (tripOpt.isEmpty())
            return ResponseEntity.notFound().build();
        TripPlan trip = tripOpt.get();
        String newOrigin = body != null ? body.get("code") : null;
        if (newOrigin != null && !newOrigin.isBlank()) {
            trip.setOrigin(newOrigin);
            // Cập nhật originLat, originLng nếu tìm được BusStation tương ứng
            try {
                double lat = 0, lng = 0;
                switch (newOrigin) {
                    case "U":
                        lat = 10.8098468;
                        lng = 106.7149365;
                        break;
                    case "AB":
                        lat = 10.8020141;
                        lng = 106.7147072;
                        break;
                    case "E":
                        lat = 10.8553228;
                        lng = 106.7855273;
                        break;
                    case "R":
                        lat = 10.8413359;
                        lng = 106.8086801;
                        break;
                }
                trip.setOriginLat(lat);
                trip.setOriginLng(lng);
            } catch (Exception ignore) {
            }
        }
        tripPlanRepository.save(trip);
        messagingTemplate.convertAndSend("/topic/admin-realtime", "reload");
        return ResponseEntity.ok("Đã cập nhật điểm đi mới cho trip plan");
    }

    @PostMapping("/update-origin-by-driver/{driverId}")
    public ResponseEntity<?> updateOriginByDriver(@PathVariable Long driverId, @RequestBody Map<String, String> body) {
        String newOrigin = body != null ? body.get("code") : null;
        if (newOrigin == null || newOrigin.isBlank()) {
            return ResponseEntity.badRequest().body("Thiếu mã khu");
        }
        // Tìm trip_plan CONFIRMED của driver này
        List<TripPlan> plans = tripPlanRepository.findByDriverIdAndStatusIn(driverId,
                java.util.Arrays.asList("CONFIRMED"));
        if (plans.isEmpty())
            return ResponseEntity.notFound().build();
        TripPlan trip = plans.get(0);
        trip.setOrigin(newOrigin);
        try {
            double lat = 0, lng = 0;
            switch (newOrigin) {
                case "U":
                    lat = 10.8098468;
                    lng = 106.7149365;
                    break;
                case "AB":
                    lat = 10.8020141;
                    lng = 106.7147072;
                    break;
                case "E":
                    lat = 10.8553228;
                    lng = 106.7855273;
                    break;
                case "R":
                    lat = 10.8413359;
                    lng = 106.8086801;
                    break;
            }
            trip.setOriginLat(lat);
            trip.setOriginLng(lng);
        } catch (Exception ignore) {
        }
        tripPlanRepository.save(trip);
        messagingTemplate.convertAndSend("/topic/admin-realtime", "reload");
        return ResponseEntity.ok("Đã cập nhật điểm đi mới cho trip plan");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTripPlan(@PathVariable Long id) {
        if (!tripPlanRepository.existsById(id))
            return ResponseEntity.notFound().build();
        tripPlanRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}