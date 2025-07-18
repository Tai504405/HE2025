package com.example.ridesharing.repository;

import com.example.ridesharing.model.BusTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusTripRepository extends JpaRepository<BusTrip, Long> {
}