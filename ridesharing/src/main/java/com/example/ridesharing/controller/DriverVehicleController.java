package com.example.ridesharing.controller;

import com.example.ridesharing.model.Vehicle;
import com.example.ridesharing.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/driver/vehicles")
public class DriverVehicleController {
    @Autowired
    private VehicleRepository vehicleRepository;

    // Lấy phương tiện được phân công cho driver
    @GetMapping("/{driverId}")
    public ResponseEntity<List<Vehicle>> getAssignedVehicles(@PathVariable Long driverId) {
        List<Vehicle> vehicles = vehicleRepository.findByDriverId(driverId);
        return ResponseEntity.ok(vehicles);
    }

    // Lấy thông tin chi tiết phương tiện
    @GetMapping("/{driverId}/detail/{vehicleId}")
    public ResponseEntity<Vehicle> getVehicleDetail(@PathVariable Long driverId, @PathVariable Long vehicleId) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(vehicleId);
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Vehicle vehicle = vehicleOpt.get();
        // Kiểm tra xem vehicle có thuộc về driver này không
        if (vehicle.getDriver() == null || !vehicle.getDriver().getId().equals(driverId)) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(vehicle);
    }

    // Cập nhật trạng thái phương tiện (chỉ driver được phân công mới được cập nhật)
    @PatchMapping("/{driverId}/vehicle/{vehicleId}/status")
    public ResponseEntity<Vehicle> updateVehicleStatus(@PathVariable Long driverId,
            @PathVariable Long vehicleId,
            @RequestBody Map<String, String> body) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(vehicleId);
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Vehicle vehicle = vehicleOpt.get();
        // Kiểm tra xem vehicle có thuộc về driver này không
        if (vehicle.getDriver() == null || !vehicle.getDriver().getId().equals(driverId)) {
            return ResponseEntity.status(403).build();
        }

        String newStatus = body.get("status");
        if (newStatus != null
                && (newStatus.equals("ACTIVE") || newStatus.equals("MAINTENANCE") || newStatus.equals("BROKEN"))) {
            vehicle.setStatus(newStatus);
            Vehicle saved = vehicleRepository.save(vehicle);
            return ResponseEntity.ok(saved);
        }

        return ResponseEntity.badRequest().build();
    }

    // Cập nhật ghi chú phương tiện
    @PatchMapping("/{driverId}/vehicle/{vehicleId}/notes")
    public ResponseEntity<Vehicle> updateVehicleNotes(@PathVariable Long driverId,
            @PathVariable Long vehicleId,
            @RequestBody Map<String, String> body) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(vehicleId);
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Vehicle vehicle = vehicleOpt.get();
        // Kiểm tra xem vehicle có thuộc về driver này không
        if (vehicle.getDriver() == null || !vehicle.getDriver().getId().equals(driverId)) {
            return ResponseEntity.status(403).build();
        }

        vehicle.setNotes(body.get("notes"));
        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(saved);
    }
}