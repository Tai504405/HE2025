package com.example.ridesharing.controller;

import com.example.ridesharing.model.Vehicle;
import com.example.ridesharing.model.User;
import com.example.ridesharing.repository.VehicleRepository;
import com.example.ridesharing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    // Lấy danh sách tất cả phương tiện
    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    // Lấy phương tiện theo ID
    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long id) {
        Optional<Vehicle> vehicle = vehicleRepository.findById(id);
        return vehicle.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Lấy phương tiện theo tài xế
    @GetMapping("/driver/{driverId}")
    public List<Vehicle> getVehiclesByDriver(@PathVariable Long driverId) {
        return vehicleRepository.findByDriverId(driverId);
    }

    // Lấy phương tiện theo trạng thái
    @GetMapping("/status/{status}")
    public List<Vehicle> getVehiclesByStatus(@PathVariable String status) {
        return vehicleRepository.findByStatus(status);
    }

    // Thêm phương tiện mới
    @PostMapping
    public ResponseEntity<Vehicle> createVehicle(@RequestBody Map<String, Object> body) {
        try {
            Vehicle vehicle = new Vehicle();
            vehicle.setVehicleCode((String) body.get("vehicleCode"));
            vehicle.setLicensePlate((String) body.get("licensePlate"));
            vehicle.setSeats(Integer.valueOf(body.get("seats").toString()));
            vehicle.setType((String) body.get("type"));
            vehicle.setStatus((String) body.get("status"));
            vehicle.setNotes((String) body.get("notes"));

            // Gán tài xế nếu có
            if (body.containsKey("driverId")) {
                Long driverId = Long.valueOf(body.get("driverId").toString());
                Optional<User> driver = userRepository.findById(driverId);
                driver.ifPresent(vehicle::setDriver);
            }

            Vehicle saved = vehicleRepository.save(vehicle);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Cập nhật phương tiện
    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Vehicle vehicle = vehicleOpt.get();
        if (body.containsKey("vehicleCode"))
            vehicle.setVehicleCode((String) body.get("vehicleCode"));
        if (body.containsKey("licensePlate"))
            vehicle.setLicensePlate((String) body.get("licensePlate"));
        if (body.containsKey("seats"))
            vehicle.setSeats(Integer.valueOf(body.get("seats").toString()));
        if (body.containsKey("type"))
            vehicle.setType((String) body.get("type"));
        if (body.containsKey("status"))
            vehicle.setStatus((String) body.get("status"));
        if (body.containsKey("notes"))
            vehicle.setNotes((String) body.get("notes"));

        // Cập nhật tài xế
        if (body.containsKey("driverId")) {
            Long driverId = Long.valueOf(body.get("driverId").toString());
            Optional<User> driver = userRepository.findById(driverId);
            vehicle.setDriver(driver.orElse(null));
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(saved);
    }

    // Xóa phương tiện
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        if (vehicleRepository.existsById(id)) {
            vehicleRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Cập nhật trạng thái phương tiện
    @PatchMapping("/{id}/status")
    public ResponseEntity<Vehicle> updateVehicleStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Vehicle vehicle = vehicleOpt.get();
        vehicle.setStatus(body.get("status"));
        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(saved);
    }

    // Báo cáo tổng quan phương tiện
    @GetMapping("/report/overview")
    public ResponseEntity<Map<String, Object>> getVehicleOverview() {
        List<Vehicle> allVehicles = vehicleRepository.findAll();
        long activeCount = allVehicles.stream().filter(v -> "ACTIVE".equals(v.getStatus())).count();
        long maintenanceCount = allVehicles.stream().filter(v -> "MAINTENANCE".equals(v.getStatus())).count();
        long brokenCount = allVehicles.stream().filter(v -> "BROKEN".equals(v.getStatus())).count();

        return ResponseEntity.ok(Map.of(
                "total", allVehicles.size(),
                "active", activeCount,
                "maintenance", maintenanceCount,
                "broken", brokenCount));
    }
}