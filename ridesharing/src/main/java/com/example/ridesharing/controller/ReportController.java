package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusRoute;
import com.example.ridesharing.model.BusSchedule;
import com.example.ridesharing.model.TripRegistration;
import com.example.ridesharing.repository.BusRouteRepository;
import com.example.ridesharing.repository.BusScheduleRepository;
import com.example.ridesharing.repository.TripRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired
    private TripRegistrationRepository tripRegistrationRepository;
    @Autowired
    private BusRouteRepository busRouteRepository;
    @Autowired
    private BusScheduleRepository busScheduleRepository;

    @GetMapping("/trip-count-by-route")
    public Map<String, Integer> getTripCountByRoute() {
        Map<String, Integer> result = new HashMap<>();
        List<BusRoute> routes = busRouteRepository.findAll();
        for (BusRoute route : routes) {
            int count = (int) tripRegistrationRepository.findAll().stream()
                    .filter(r -> r.getTrip().getSchedule().getRoute().getId().equals(route.getId()))
                    .count();
            result.put(route.getName(), count);
        }
        return result;
    }

    @GetMapping("/trip-count-by-schedule")
    public Map<String, Integer> getTripCountBySchedule() {
        Map<String, Integer> result = new HashMap<>();
        List<BusSchedule> schedules = busScheduleRepository.findAll();
        for (BusSchedule schedule : schedules) {
            int count = (int) tripRegistrationRepository.findAll().stream()
                    .filter(r -> r.getTrip().getSchedule().getId().equals(schedule.getId()))
                    .count();
            result.put(schedule.getType() + " (" + schedule.getStartTime() + ")", count);
        }
        return result;
    }
}