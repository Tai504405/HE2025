package com.example.ridesharing.controller;

import com.example.ridesharing.dto.CreateShiftRequest;
import com.example.ridesharing.model.Shift;
import com.example.ridesharing.service.ShiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/shifts")
@CrossOrigin(origins = "*")
public class ShiftController {

    @Autowired
    private ShiftService shiftService;

    /**
     * Tạo ca di chuyển mới
     */
    @PostMapping
    public ResponseEntity<?> createShift(@RequestBody CreateShiftRequest request) {
        try {
            Shift shift = shiftService.createShift(request);
            return ResponseEntity.ok(shift);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Lấy tất cả ca
     */
    @GetMapping
    public ResponseEntity<List<Shift>> getAllShifts() {
        List<Shift> shifts = shiftService.getAllShifts();
        return ResponseEntity.ok(shifts);
    }

    /**
     * Lấy ca theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getShiftById(@PathVariable Long id) {
        Optional<Shift> shift = shiftService.getShiftById(id);
        if (shift.isPresent()) {
            return ResponseEntity.ok(shift.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Lấy ca theo trạng thái
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Shift>> getShiftsByStatus(@PathVariable String status) {
        try {
            Shift.ShiftStatus shiftStatus = Shift.ShiftStatus.valueOf(status);
            List<Shift> shifts = shiftService.getShiftsByStatus(shiftStatus);
            return ResponseEntity.ok(shifts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Lấy ca theo loại
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Shift>> getShiftsByType(@PathVariable String type) {
        try {
            Shift.ShiftType shiftType = Shift.ShiftType.valueOf(type);
            List<Shift> shifts = shiftService.getShiftsByType(shiftType);
            return ResponseEntity.ok(shifts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Cập nhật trạng thái ca
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateShiftStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            Shift.ShiftStatus newStatus = Shift.ShiftStatus.valueOf(status);
            Shift shift = shiftService.updateShiftStatus(id, newStatus);
            return ResponseEntity.ok(shift);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Trạng thái không hợp lệ");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Tài xế xác nhận tham gia chuyến đi
     */
    @PostMapping("/trips/{tripId}/confirm")
    public ResponseEntity<?> confirmDriverParticipation(
            @PathVariable Long tripId,
            @RequestParam Long driverId) {
        try {
            shiftService.confirmDriverParticipation(tripId, driverId);
            return ResponseEntity.ok("Xác nhận tham gia thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Tài xế từ chối tham gia chuyến đi
     */
    @PostMapping("/trips/{tripId}/reject")
    public ResponseEntity<?> rejectDriverParticipation(
            @PathVariable Long tripId,
            @RequestParam Long driverId) {
        try {
            shiftService.rejectDriverParticipation(tripId, driverId);
            return ResponseEntity.ok("Từ chối tham gia thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Lấy ca của tài xế
     */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Shift>> getShiftsByDriver(@PathVariable Long driverId) {
        List<Shift> shifts = shiftService.getShiftsByDriver(driverId);
        return ResponseEntity.ok(shifts);
    }

    /**
     * Lấy ca hiện tại
     */
    @GetMapping("/current")
    public ResponseEntity<List<Shift>> getCurrentShifts() {
        List<Shift> shifts = shiftService.getCurrentShifts();
        return ResponseEntity.ok(shifts);
    }

    /**
     * Lấy ca sắp tới
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<Shift>> getUpcomingShifts() {
        List<Shift> shifts = shiftService.getUpcomingShifts();
        return ResponseEntity.ok(shifts);
    }

    /**
     * Xóa ca
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShift(@PathVariable Long id) {
        try {
            // TODO: Implement delete logic
            return ResponseEntity.ok("Xóa ca thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }
}