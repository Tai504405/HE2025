package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusStation;
import com.example.ridesharing.repository.BusStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stations")
public class BusStationController {
    @Autowired
    private BusStationRepository busStationRepository;

    @GetMapping("")
    public List<BusStation> getAllStations() {
        return busStationRepository.findAll();
    }
}