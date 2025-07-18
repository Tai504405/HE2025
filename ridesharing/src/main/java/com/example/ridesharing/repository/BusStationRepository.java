package com.example.ridesharing.repository;

import com.example.ridesharing.model.BusStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusStationRepository extends JpaRepository<BusStation, Long> {
    BusStation findByCode(String code);
}