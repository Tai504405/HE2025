package com.example.ridesharing.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicle")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "NVARCHAR(50)")
    private String vehicleCode; // Mã xe (VD: BUS001)

    @Column(columnDefinition = "NVARCHAR(20)")
    private String licensePlate; // Biển số

    private int seats; // Sức chứa

    @Column(columnDefinition = "NVARCHAR(100)")
    private String type; // Loại xe

    @Column(columnDefinition = "NVARCHAR(50)")
    private String status; // Tình trạng: ACTIVE, MAINTENANCE, BROKEN

    @Column(columnDefinition = "NVARCHAR(500)")
    private String notes; // Ghi chú

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver; // Tài xế phụ trách

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVehicleCode() {
        return vehicleCode;
    }

    public void setVehicleCode(String vehicleCode) {
        this.vehicleCode = vehicleCode;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getDriver() {
        return driver;
    }

    public void setDriver(User driver) {
        this.driver = driver;
    }

    public Vehicle() {
    }

    public Vehicle(String vehicleCode, String licensePlate, int seats) {
        this.vehicleCode = vehicleCode;
        this.licensePlate = licensePlate;
        this.seats = seats;
        this.status = "ACTIVE";
    }
}