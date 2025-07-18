package com.example.ridesharing.controller;

import com.example.ridesharing.model.Vehicle;
import com.example.ridesharing.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping("")
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }
}