package com.example.ridesharing.controller;

import com.example.ridesharing.model.Trip;
import com.example.ridesharing.repository.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {

    @Autowired
    private TripRepository tripRepository;

    @GetMapping
    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    @GetMapping("/driver/{userId}")
    public List<Trip> getTripsByDriver(@PathVariable Long userId) {
        return tripRepository.findByUserId(userId);
    }

    @PostMapping
    public Trip createTrip(@RequestBody Trip trip) {
        // Mặc định trạng thái CREATED khi tạo mới
        trip.setStatus("CREATED");
        return tripRepository.save(trip);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Trip> updateStatus(@PathVariable Long id, @RequestBody String status) {
        Optional<Trip> optional = tripRepository.findById(id);
        if (optional.isEmpty())
            return ResponseEntity.notFound().build();
        Trip trip = optional.get();
        trip.setStatus(status);
        return ResponseEntity.ok(tripRepository.save(trip));
    }
}
