package com.example.ridesharing.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bus_trip")
public class BusTrip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "schedule_id")
    private BusSchedule schedule;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "shift_id")
    private Shift shift; // Thêm reference đến Shift

    private String status; // WAITING, BOARDING, RUNNING, FINISHED

    @ManyToOne
    @JoinColumn(name = "current_station_id")
    private BusStation currentStation;

    private int seatsTotal;
    private int seatsAvailable;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    private Double currentLat;
    private Double currentLng;
    private String currentStatus; // IDLE, READY, MOVING, ARRIVED, STOPPED

    @Column(columnDefinition = "NVARCHAR(500)")
    private String notes; // Ghi chú cho chuyến đi

    private Boolean registrationLocked = false; // Khóa đăng ký

    private Boolean driverConfirmed = false; // Tài xế đã xác nhận tham gia

    @Column(columnDefinition = "NVARCHAR(255)")
    private String origin; // Tên/mã điểm đi

    @Column(columnDefinition = "NVARCHAR(255)")
    private String destination; // Tên/mã điểm đến

    private Double originLat;
    private Double originLng;
    private Double destinationLat;
    private Double destinationLng;

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BusSchedule getSchedule() {
        return schedule;
    }

    public void setSchedule(BusSchedule schedule) {
        this.schedule = schedule;
    }

    public User getDriver() {
        return driver;
    }

    public void setDriver(User driver) {
        this.driver = driver;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public Shift getShift() {
        return shift;
    }

    public void setShift(Shift shift) {
        this.shift = shift;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BusStation getCurrentStation() {
        return currentStation;
    }

    public void setCurrentStation(BusStation currentStation) {
        this.currentStation = currentStation;
    }

    public int getSeatsTotal() {
        return seatsTotal;
    }

    public void setSeatsTotal(int seatsTotal) {
        this.seatsTotal = seatsTotal;
    }

    public int getSeatsAvailable() {
        return seatsAvailable;
    }

    public void setSeatsAvailable(int seatsAvailable) {
        this.seatsAvailable = seatsAvailable;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public Double getCurrentLat() {
        return currentLat;
    }

    public void setCurrentLat(Double currentLat) {
        this.currentLat = currentLat;
    }

    public Double getCurrentLng() {
        return currentLng;
    }

    public void setCurrentLng(Double currentLng) {
        this.currentLng = currentLng;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }

    public void setCurrentStatus(String currentStatus) {
        this.currentStatus = currentStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getRegistrationLocked() {
        return registrationLocked;
    }

    public void setRegistrationLocked(Boolean registrationLocked) {
        this.registrationLocked = registrationLocked;
    }

    public Boolean getDriverConfirmed() {
        return driverConfirmed;
    }

    public void setDriverConfirmed(Boolean driverConfirmed) {
        this.driverConfirmed = driverConfirmed;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public Double getOriginLat() {
        return originLat;
    }

    public void setOriginLat(Double originLat) {
        this.originLat = originLat;
    }

    public Double getOriginLng() {
        return originLng;
    }

    public void setOriginLng(Double originLng) {
        this.originLng = originLng;
    }

    public Double getDestinationLat() {
        return destinationLat;
    }

    public void setDestinationLat(Double destinationLat) {
        this.destinationLat = destinationLat;
    }

    public Double getDestinationLng() {
        return destinationLng;
    }

    public void setDestinationLng(Double destinationLng) {
        this.destinationLng = destinationLng;
    }
}