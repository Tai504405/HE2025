package com.example.ridesharing.repository;

import com.example.ridesharing.model.Vehicle;
import com.example.ridesharing.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByDriverId(Long driverId);

    List<Vehicle> findByDriver(User driver);

    List<Vehicle> findByStatus(String status);

    Optional<Vehicle> findByVehicleCode(String vehicleCode);
}