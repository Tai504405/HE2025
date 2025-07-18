package com.example.ridesharing.controller;

import com.example.ridesharing.model.BusSchedule;
import com.example.ridesharing.repository.BusScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class BusScheduleController {
    @Autowired
    private BusScheduleRepository busScheduleRepository;

    @GetMapping("")
    public List<BusSchedule> getAllSchedules() {
        return busScheduleRepository.findAll();
    }
}