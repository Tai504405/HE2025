package com.example.ridesharing.controller;

import com.example.ridesharing.model.Trip;
import com.example.ridesharing.repository.TripRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trips/suggestions")
@CrossOrigin(origins = "http://localhost:3000") // Cho React gọi được
public class TripSuggestionController {

    private final TripRepository tripRepository;

    public TripSuggestionController(TripRepository tripRepository) {
        this.tripRepository = tripRepository;
    }

    @GetMapping("/{userId}")
public List<Trip> suggestTrips(@PathVariable Long userId) {
    return tripRepository.findAll().stream()
        .filter(trip -> trip.getUserId() != null && !trip.getUserId().equals(userId))
        .collect(Collectors.toList());
}

}
