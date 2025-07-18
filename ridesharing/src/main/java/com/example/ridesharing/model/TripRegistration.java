package com.example.ridesharing.model;

import jakarta.persistence.*;

@Entity
@Table(name = "trip_registration")
public class TripRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "trip_id")
    private BusTrip trip;

    @ManyToOne
    @JoinColumn(name = "station_id")
    private BusStation station;

    private String qrCode;
    private String status; // REGISTERED, CANCELLED, BOARDED

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BusTrip getTrip() {
        return trip;
    }

    public void setTrip(BusTrip trip) {
        this.trip = trip;
    }

    public BusStation getStation() {
        return station;
    }

    public void setStation(BusStation station) {
        this.station = station;
    }

    public String getQrCode() {
        return qrCode;
    }

    public void setQrCode(String qrCode) {
        this.qrCode = qrCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}