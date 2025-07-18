package com.example.ridesharing.controller;

import com.example.ridesharing.model.Registration;
import com.example.ridesharing.model.Trip;
import com.example.ridesharing.repository.RegistrationRepository;
import com.example.ridesharing.repository.TripRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/registrations")
@CrossOrigin(origins = "*")
public class RegistrationController {
    private final RegistrationRepository registrationRepository;
    private final TripRepository tripRepository;

    public RegistrationController(RegistrationRepository registrationRepository, TripRepository tripRepository) {
        this.registrationRepository = registrationRepository;
        this.tripRepository = tripRepository;
    }

    // Hành khách đăng ký chuyến đi
    @PostMapping
    public ResponseEntity<?> register(@RequestBody Registration registration) {
        // Kiểm tra đã đăng ký chưa
        Registration existing = registrationRepository.findByTripIdAndPassengerId(registration.getTripId(),
                registration.getPassengerId());
        if (existing != null) {
            return ResponseEntity.badRequest().body("Đã đăng ký chuyến đi này!");
        }
        registration.setStatus("PENDING");
        return ResponseEntity.ok(registrationRepository.save(registration));
    }

    // Tài xế xác nhận hành khách lên xe (giảm seatCount)
    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id) {
        Optional<Registration> regOpt = registrationRepository.findById(id);
        if (regOpt.isEmpty())
            return ResponseEntity.notFound().build();
        Registration reg = regOpt.get();
        if (!"PENDING".equals(reg.getStatus()))
            return ResponseEntity.badRequest().body("Chỉ xác nhận đăng ký đang chờ!");
        Optional<Trip> tripOpt = tripRepository.findById(reg.getTripId());
        if (tripOpt.isEmpty())
            return ResponseEntity.badRequest().body("Không tìm thấy chuyến đi!");
        Trip trip = tripOpt.get();
        if (trip.getSeatCount() <= 0)
            return ResponseEntity.badRequest().body("Hết chỗ!");
        trip.setSeatCount(trip.getSeatCount() - 1);
        reg.setStatus("CONFIRMED");
        tripRepository.save(trip);
        registrationRepository.save(reg);
        return ResponseEntity.ok(reg);
    }

    // Hủy xác nhận (tăng seatCount)
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        Optional<Registration> regOpt = registrationRepository.findById(id);
        if (regOpt.isEmpty())
            return ResponseEntity.notFound().build();
        Registration reg = regOpt.get();
        if (!"CONFIRMED".equals(reg.getStatus()))
            return ResponseEntity.badRequest().body("Chỉ hủy đăng ký đã xác nhận!");
        Optional<Trip> tripOpt = tripRepository.findById(reg.getTripId());
        if (tripOpt.isEmpty())
            return ResponseEntity.badRequest().body("Không tìm thấy chuyến đi!");
        Trip trip = tripOpt.get();
        trip.setSeatCount(trip.getSeatCount() + 1);
        reg.setStatus("CANCELLED");
        tripRepository.save(trip);
        registrationRepository.save(reg);
        return ResponseEntity.ok(reg);
    }

    // Lấy danh sách đăng ký theo chuyến đi
    @GetMapping("/trip/{tripId}")
    public List<Registration> getByTrip(@PathVariable Long tripId) {
        return registrationRepository.findByTripId(tripId);
    }

    // Lấy danh sách đăng ký theo hành khách
    @GetMapping("/passenger/{passengerId}")
    public List<Registration> getByPassenger(@PathVariable Long passengerId) {
        return registrationRepository.findByPassengerId(passengerId);
    }
}