package com.example.ridesharing.controller;

import com.example.ridesharing.model.TripRegistration;
import com.example.ridesharing.repository.TripRegistrationRepository;
import com.example.ridesharing.repository.UserRepository;
import com.example.ridesharing.repository.BusTripRepository;
import com.example.ridesharing.repository.BusStationRepository;
import com.example.ridesharing.model.User;
import com.example.ridesharing.model.BusTrip;
import com.example.ridesharing.model.BusStation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/trip-registrations")
@CrossOrigin(origins = "*")
public class TripRegistrationController {
    @Autowired
    private TripRegistrationRepository tripRegistrationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BusTripRepository busTripRepository;
    @Autowired
    private BusStationRepository busStationRepository;

    @PostMapping("")
    public ResponseEntity<?> registerTrip(@RequestBody TripRegistration registration) {
        Optional<User> user = userRepository.findById(registration.getUser().getId());
        Optional<BusTrip> trip = busTripRepository.findById(registration.getTrip().getId());
        Optional<BusStation> station = busStationRepository.findById(registration.getStation().getId());

        if (user.isEmpty() || trip.isEmpty() || station.isEmpty()) {
            return ResponseEntity.badRequest().body("Thông tin không hợp lệ");
        }

        BusTrip busTrip = trip.get();

        // Kiểm tra trạng thái khóa đăng ký
        if (busTrip.getRegistrationLocked() != null && busTrip.getRegistrationLocked()) {
            return ResponseEntity.badRequest().body("Chuyến đi đã bị khóa đăng ký");
        }

        // Kiểm tra số ghế còn trống
        if (busTrip.getSeatsAvailable() <= 0) {
            return ResponseEntity.badRequest().body("Chuyến đi đã hết chỗ");
        }

        // Kiểm tra người dùng đã đăng ký chuyến này chưa
        List<TripRegistration> existingRegistrations = tripRegistrationRepository.findAll()
                .stream()
                .filter(r -> r.getUser().getId().equals(user.get().getId()) &&
                        r.getTrip().getId().equals(busTrip.getId()) &&
                        !r.getStatus().equals("CANCELLED"))
                .toList();

        if (!existingRegistrations.isEmpty()) {
            return ResponseEntity.badRequest().body("Bạn đã đăng ký chuyến đi này rồi");
        }

        registration.setUser(user.get());
        registration.setTrip(busTrip);
        registration.setStation(station.get());
        registration.setStatus("REGISTERED");

        TripRegistration saved = tripRegistrationRepository.save(registration);

        // Cập nhật số ghế còn trống
        busTrip.setSeatsAvailable(busTrip.getSeatsAvailable() - 1);
        busTripRepository.save(busTrip);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{userId}")
    public List<TripRegistration> getRegistrationsByUser(@PathVariable Long userId) {
        return tripRegistrationRepository.findAll().stream()
                .filter(r -> r.getUser().getId().equals(userId))
                .toList();
    }

    @GetMapping("/trip/{tripId}")
    public List<TripRegistration> getRegistrationsByTrip(@PathVariable Long tripId) {
        return tripRegistrationRepository.findAll().stream()
                .filter(r -> r.getTrip().getId().equals(tripId))
                .toList();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelRegistration(@PathVariable Long id) {
        Optional<TripRegistration> reg = tripRegistrationRepository.findById(id);
        if (reg.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        TripRegistration registration = reg.get();
        BusTrip trip = registration.getTrip();

        // Cập nhật số ghế còn trống
        trip.setSeatsAvailable(trip.getSeatsAvailable() + 1);
        busTripRepository.save(trip);

        tripRegistrationRepository.deleteById(id);
        return ResponseEntity.ok("Đã hủy đăng ký");
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateRegistrationStatus(@PathVariable Long id, @RequestBody String status) {
        Optional<TripRegistration> reg = tripRegistrationRepository.findById(id);
        if (reg.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        TripRegistration registration = reg.get();
        registration.setStatus(status);
        tripRegistrationRepository.save(registration);

        return ResponseEntity.ok(registration);
    }
}