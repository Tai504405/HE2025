package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusRoute;
import com.example.ridesharing.repository.BusRouteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/routes")
public class BusRouteController {
    @Autowired
    private BusRouteRepository busRouteRepository;

    @GetMapping("")
    public List<BusRoute> getAllRoutes() {
        return busRouteRepository.findAll();
    }
}