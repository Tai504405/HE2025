package com.example.ridesharing.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "shifts")
public class Shift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftType shiftType; // SANG, TRUA, CHIEU

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShiftStatus status = ShiftStatus.CHO_XAC_NHAN;

    @OneToMany(mappedBy = "shift", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BusTrip> trips;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Enums
    public enum ShiftType {
        SANG("Sáng"),
        TRUA("Trưa"),
        CHIEU("Chiều");

        private final String displayName;

        ShiftType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum ShiftStatus {
        CHO_XAC_NHAN("Chờ xác nhận"),
        SAN_SANG_CHAY("Sẵn sàng chạy"),
        DANG_CHAY("Đang chạy"),
        DA_HOAN_TAT("Đã hoàn tất"),
        BI_HUY("Bị hủy");

        private final String displayName;

        ShiftStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // Constructors
    public Shift() {
    }

    public Shift(ShiftType shiftType, LocalDateTime startTime, LocalDateTime endTime) {
        this.shiftType = shiftType;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ShiftType getShiftType() {
        return shiftType;
    }

    public void setShiftType(ShiftType shiftType) {
        this.shiftType = shiftType;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public ShiftStatus getStatus() {
        return status;
    }

    public void setStatus(ShiftStatus status) {
        this.status = status;
    }

    public List<BusTrip> getTrips() {
        return trips;
    }

    public void setTrips(List<BusTrip> trips) {
        this.trips = trips;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Business methods
    public boolean isAllDriversConfirmed() {
        if (trips == null || trips.isEmpty()) {
            return false;
        }
        return trips.stream().allMatch(trip -> trip.getDriverConfirmed());
    }

    public boolean canStart() {
        return status == ShiftStatus.SAN_SANG_CHAY &&
                LocalDateTime.now().isAfter(startTime) &&
                isAllDriversConfirmed();
    }

    public boolean isCompleted() {
        return LocalDateTime.now().isAfter(endTime);
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}