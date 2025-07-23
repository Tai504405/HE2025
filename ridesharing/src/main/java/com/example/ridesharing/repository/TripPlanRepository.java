package com.example.ridesharing.repository;

import com.example.ridesharing.model.TripPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripPlanRepository extends JpaRepository<TripPlan, Long> {
    List<TripPlan> findByDriverIdAndStatusIn(Long driverId, List<String> statuses);
}