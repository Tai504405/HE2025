package com.example.ridesharing.controller;

import com.example.ridesharing.model.TripRegistration;
import com.example.ridesharing.repository.TripRegistrationRepository;
import com.example.ridesharing.repository.UserRepository;
import com.example.ridesharing.repository.BusTripRepository;
import com.example.ridesharing.repository.BusStationRepository;
import com.example.ridesharing.model.User;
import com.example.ridesharing.model.BusTrip;
import com.example.ridesharing.model.BusStation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trip-registrations")
public class TripRegistrationController {
    @Autowired
    private TripRegistrationRepository tripRegistrationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BusTripRepository busTripRepository;
    @Autowired
    private BusStationRepository busStationRepository;

    @PostMapping("")
    public ResponseEntity<?> registerTrip(@RequestBody TripRegistration registration) {
        Optional<User> user = userRepository.findById(registration.getUser().getId());
        Optional<BusTrip> trip = busTripRepository.findById(registration.getTrip().getId());
        Optional<BusStation> station = busStationRepository.findById(registration.getStation().getId());
        if (user.isEmpty() || trip.isEmpty() || station.isEmpty()) {
            return ResponseEntity.badRequest().body("Thông tin không hợp lệ");
        }
        registration.setUser(user.get());
        registration.setTrip(trip.get());
        registration.setStation(station.get());
        registration.setStatus("REGISTERED");
        TripRegistration saved = tripRegistrationRepository.save(registration);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{userId}")
    public List<TripRegistration> getRegistrationsByUser(@PathVariable Long userId) {
        return tripRegistrationRepository.findAll().stream()
                .filter(r -> r.getUser().getId().equals(userId))
                .toList();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelRegistration(@PathVariable Long id) {
        Optional<TripRegistration> reg = tripRegistrationRepository.findById(id);
        if (reg.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        tripRegistrationRepository.deleteById(id);
        return ResponseEntity.ok("Đã hủy đăng ký");
    }
}