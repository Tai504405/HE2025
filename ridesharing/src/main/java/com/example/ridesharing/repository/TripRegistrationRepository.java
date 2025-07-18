package com.example.ridesharing.repository;

import com.example.ridesharing.model.TripRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TripRegistrationRepository extends JpaRepository<TripRegistration, Long> {
}