package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusTrip;
import com.example.ridesharing.repository.BusTripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bus-trips")
public class BusTripController {
    @Autowired
    private BusTripRepository busTripRepository;

    @GetMapping("")
    public List<BusTrip> getAllTrips() {
        return busTripRepository.findAll();
    }

    @GetMapping("/{id}")
    public BusTrip getTripById(@PathVariable Long id) {
        Optional<BusTrip> trip = busTripRepository.findById(id);
        return trip.orElse(null);
    }

    @PostMapping("")
    public BusTrip createBusTrip(@RequestBody BusTrip trip) {
        return busTripRepository.save(trip);
    }
}