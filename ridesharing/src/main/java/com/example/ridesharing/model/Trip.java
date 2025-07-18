package com.example.ridesharing.model;

import java.time.LocalDateTime;

import com.example.ridesharing.model.Trip; // nếu Trip nằm trong package model

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String origin;
    private String destination;
    private LocalDateTime departureTime;
    private int seatCount;
    private Long vehicleId;
    private String status; // VD: CREATED, STARTED, IN_PROGRESS, FINISHED

    // GPS coordinates
    private Double originLat;
    private Double originLng;
    private Double destinationLat;
    private Double destinationLng;
}
