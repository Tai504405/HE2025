package com.example.ridesharing.repository;

import com.example.ridesharing.model.BusTrip;
import com.example.ridesharing.model.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusTripRepository extends JpaRepository<BusTrip, Long> {
    List<BusTrip> findByShift(Shift shift);
}