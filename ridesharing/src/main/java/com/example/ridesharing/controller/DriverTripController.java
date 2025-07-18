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
import com.example.ridesharing.model.User;

@RestController
@RequestMapping("/api/driver")
public class DriverTripController {
    @Autowired
    private BusTripRepository busTripRepository;
    @Autowired
    private BusStationRepository busStationRepository;

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
        BusTrip trip = new BusTrip();
        trip.setStatus("WAITING");
        trip.setSeatsTotal(30);
        trip.setSeatsAvailable(30);
        trip.setCurrentStatus("READY");
        trip.setCurrentLat(10.8098468); // U mặc định
        trip.setCurrentLng(106.7149365);
        trip.setDriver(new User());
        trip.getDriver().setId(driverId);
        BusTrip saved = busTripRepository.save(trip);
        return ResponseEntity.ok(Map.of("tripId", saved.getId()));
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