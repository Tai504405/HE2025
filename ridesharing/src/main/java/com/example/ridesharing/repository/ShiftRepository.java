package com.example.ridesharing.repository;

import com.example.ridesharing.model.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {

    // Tìm ca theo loại
    List<Shift> findByShiftType(Shift.ShiftType shiftType);

    // Tìm ca theo trạng thái
    List<Shift> findByStatus(Shift.ShiftStatus status);

    // Tìm ca theo khoảng thời gian
    @Query("SELECT s FROM Shift s WHERE s.startTime >= :startDate AND s.endTime <= :endDate")
    List<Shift> findByDateRange(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Tìm ca theo loại và trạng thái
    List<Shift> findByShiftTypeAndStatus(Shift.ShiftType shiftType, Shift.ShiftStatus status);

    // Tìm ca trong tương lai
    @Query("SELECT s FROM Shift s WHERE s.startTime > :now ORDER BY s.startTime ASC")
    List<Shift> findUpcomingShifts(@Param("now") LocalDateTime now);

    // Tìm ca hiện tại (đang diễn ra)
    @Query("SELECT s FROM Shift s WHERE s.startTime <= :now AND s.endTime >= :now")
    List<Shift> findCurrentShifts(@Param("now") LocalDateTime now);

    // Tìm ca theo tài xế (thông qua trips)
    @Query("SELECT DISTINCT s FROM Shift s JOIN s.trips t WHERE t.driver.id = :driverId")
    List<Shift> findByDriverId(@Param("driverId") Long driverId);

    // Tìm ca theo xe (thông qua trips)
    @Query("SELECT DISTINCT s FROM Shift s JOIN s.trips t WHERE t.vehicle.id = :vehicleId")
    List<Shift> findByVehicleId(@Param("vehicleId") Long vehicleId);
}