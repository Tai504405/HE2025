package com.example.ridesharing.dto;

import com.example.ridesharing.model.Shift;
import java.time.LocalDateTime;
import java.util.List;

public class CreateShiftRequest {
    private Shift.ShiftType shiftType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String notes;
    private List<TripRequest> trips;

    public static class TripRequest {
        private Long scheduleId; // Lịch trình (khu xuất phát)
        private Long driverId; // Tài xế
        private Long vehicleId; // Xe (có thể null để tự động gán)
        private String notes; // Ghi chú cho chuyến đi

        // Getters and Setters
        public Long getScheduleId() {
            return scheduleId;
        }

        public void setScheduleId(Long scheduleId) {
            this.scheduleId = scheduleId;
        }

        public Long getDriverId() {
            return driverId;
        }

        public void setDriverId(Long driverId) {
            this.driverId = driverId;
        }

        public Long getVehicleId() {
            return vehicleId;
        }

        public void setVehicleId(Long vehicleId) {
            this.vehicleId = vehicleId;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    // Getters and Setters
    public Shift.ShiftType getShiftType() {
        return shiftType;
    }

    public void setShiftType(Shift.ShiftType shiftType) {
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<TripRequest> getTrips() {
        return trips;
    }

    public void setTrips(List<TripRequest> trips) {
        this.trips = trips;
    }
}