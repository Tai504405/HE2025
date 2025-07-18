package com.example.ridesharing.repository;

import com.example.ridesharing.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByTripId(Long tripId);

    List<Registration> findByPassengerId(Long passengerId);

    Registration findByTripIdAndPassengerId(Long tripId, Long passengerId);
}