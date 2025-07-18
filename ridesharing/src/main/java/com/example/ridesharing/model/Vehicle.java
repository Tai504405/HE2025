package com.example.ridesharing.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicle")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String licensePlate;
    private int seats;
    private String type;
    private String status;
    private Long ownerId;

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public int getSeats() {
        return seats;
    }

    public void setSeats(int seats) {
        this.seats = seats;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public Vehicle() {
    }

    public Vehicle(String licensePlate, int seats) {
        this.licensePlate = licensePlate;
        this.seats = seats;
    }

    public Vehicle(String licensePlate, String type, String status, Long ownerId) {
        this.licensePlate = licensePlate;
        this.type = type;
        this.status = status;
        this.ownerId = ownerId;
    }
}