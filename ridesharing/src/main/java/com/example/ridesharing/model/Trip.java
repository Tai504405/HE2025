package com.example.ridesharing.model;

import java.time.LocalDateTime;
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
    @Column(columnDefinition = "NVARCHAR(255)")
    private String origin;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String destination;

    private LocalDateTime departureTime;
    private int seatCount;
    private Long vehicleId;

    @Column(columnDefinition = "NVARCHAR(50)")
    private String status; // VD: CREATED, STARTED, IN_PROGRESS, FINISHED

    // GPS coordinates
    private Double originLat;
    private Double originLng;
    private Double destinationLat;
    private Double destinationLng;
}
