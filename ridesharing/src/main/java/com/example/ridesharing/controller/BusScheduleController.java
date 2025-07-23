package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusSchedule;
import com.example.ridesharing.repository.BusScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bus-schedules")
@CrossOrigin(origins = "*")
public class BusScheduleController {

    @Autowired
    private BusScheduleRepository busScheduleRepository;

    @GetMapping("")
    public List<BusSchedule> getAllSchedules() {
        return busScheduleRepository.findAll();
    }

    @GetMapping("/{id}")
    public BusSchedule getScheduleById(@PathVariable Long id) {
        return busScheduleRepository.findById(id).orElse(null);
    }

    @GetMapping("/type/{type}")
    public List<BusSchedule> getSchedulesByType(@PathVariable String type) {
        return busScheduleRepository.findAll().stream()
                .filter(schedule -> type.equals(schedule.getType()))
                .toList();
    }
}