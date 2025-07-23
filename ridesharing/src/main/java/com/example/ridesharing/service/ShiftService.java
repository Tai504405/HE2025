package com.example.ridesharing.service;

import com.example.ridesharing.dto.CreateShiftRequest;
import com.example.ridesharing.model.*;
import com.example.ridesharing.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ShiftService {

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private BusTripRepository busTripRepository;

    @Autowired
    private BusScheduleRepository busScheduleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BusStationRepository busStationRepository;

    /**
     * Tạo ca di chuyển mới
     */
    @Transactional
    public Shift createShift(CreateShiftRequest request) {
        // Validate input
        validateCreateShiftRequest(request);

        // Tạo ca mới
        Shift shift = new Shift();
        shift.setShiftType(request.getShiftType());
        shift.setStartTime(request.getStartTime());
        shift.setEndTime(request.getEndTime());
        shift.setNotes(request.getNotes());
        shift.setStatus(Shift.ShiftStatus.CHO_XAC_NHAN);

        shift = shiftRepository.save(shift);

        // Tạo các chuyến đi trong ca
        for (CreateShiftRequest.TripRequest tripRequest : request.getTrips()) {
            BusTrip trip = createTripInShift(shift, tripRequest);
            busTripRepository.save(trip);
        }

        return shift;
    }

    /**
     * Tạo chuyến đi trong ca
     */
    private BusTrip createTripInShift(Shift shift, CreateShiftRequest.TripRequest tripRequest) {
        // Lấy lịch trình
        BusSchedule schedule = busScheduleRepository.findById(tripRequest.getScheduleId())
                .orElseThrow(() -> new RuntimeException("Lịch trình không tồn tại"));

        // Lấy tài xế
        User driver = userRepository.findById(tripRequest.getDriverId())
                .orElseThrow(() -> new RuntimeException("Tài xế không tồn tại"));

        // Lấy xe (tự động hoặc theo yêu cầu)
        Vehicle vehicle = getVehicleForTrip(tripRequest.getVehicleId(), driver);

        // Lấy trạm xuất phát (từ lịch trình)
        BusStation startStation = getStartStationFromSchedule(schedule);

        // Tạo chuyến đi
        BusTrip trip = new BusTrip();
        trip.setShift(shift);
        trip.setSchedule(schedule);
        trip.setDriver(driver);
        trip.setVehicle(vehicle);
        trip.setStatus("WAITING");
        trip.setCurrentStation(startStation);
        trip.setSeatsTotal(vehicle.getSeats());
        trip.setSeatsAvailable(vehicle.getSeats());
        trip.setStartedAt(shift.getStartTime());
        trip.setCurrentStatus("IDLE");
        trip.setNotes(tripRequest.getNotes());
        trip.setDriverConfirmed(false);

        return trip;
    }

    /**
     * Lấy xe cho chuyến đi (tự động hoặc theo yêu cầu)
     */
    private Vehicle getVehicleForTrip(Long requestedVehicleId, User driver) {
        if (requestedVehicleId != null) {
            // Sử dụng xe được chỉ định
            return vehicleRepository.findById(requestedVehicleId)
                    .orElseThrow(() -> new RuntimeException("Xe không tồn tại"));
        } else {
            // Tự động gán xe của tài xế
            List<Vehicle> driverVehicles = vehicleRepository.findByDriver(driver);
            if (driverVehicles.isEmpty()) {
                throw new RuntimeException("Tài xế " + driver.getName() + " chưa được gán xe");
            }
            return driverVehicles.get(0); // Lấy xe đầu tiên
        }
    }

    /**
     * Lấy trạm xuất phát từ lịch trình
     */
    private BusStation getStartStationFromSchedule(BusSchedule schedule) {
        // Logic để xác định trạm xuất phát dựa trên lịch trình
        // Có thể cần thêm trường startStation vào BusSchedule
        List<BusStation> stations = busStationRepository.findAll();
        if (!stations.isEmpty()) {
            return stations.get(0); // Tạm thời lấy trạm đầu tiên
        }
        throw new RuntimeException("Không có trạm nào trong hệ thống");
    }

    /**
     * Validate request tạo ca
     */
    private void validateCreateShiftRequest(CreateShiftRequest request) {
        if (request.getTrips() == null || request.getTrips().isEmpty()) {
            throw new RuntimeException("Ca phải có ít nhất 1 chuyến đi");
        }

        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new RuntimeException("Thời gian bắt đầu và kết thúc không được để trống");
        }

        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new RuntimeException("Thời gian bắt đầu phải trước thời gian kết thúc");
        }

        // Kiểm tra trùng lịch trình trong ca
        List<Long> scheduleIds = request.getTrips().stream()
                .map(CreateShiftRequest.TripRequest::getScheduleId)
                .toList();

        if (scheduleIds.size() != scheduleIds.stream().distinct().count()) {
            throw new RuntimeException("Không được có 2 chuyến đi cùng lịch trình trong 1 ca");
        }

        // Kiểm tra trùng tài xế trong ca
        List<Long> driverIds = request.getTrips().stream()
                .map(CreateShiftRequest.TripRequest::getDriverId)
                .toList();

        if (driverIds.size() != driverIds.stream().distinct().count()) {
            throw new RuntimeException("Một tài xế chỉ được tham gia 1 chuyến đi trong 1 ca");
        }

        // Kiểm tra xung đột thời gian với các ca khác
        validateTimeConflict(request);
    }

    /**
     * Kiểm tra xung đột thời gian
     */
    private void validateTimeConflict(CreateShiftRequest request) {
        List<Shift> conflictingShifts = shiftRepository.findByDateRange(
                request.getStartTime(), request.getEndTime());

        for (Shift existingShift : conflictingShifts) {
            // Kiểm tra xung đột tài xế
            for (CreateShiftRequest.TripRequest tripRequest : request.getTrips()) {
                List<Shift> driverShifts = shiftRepository.findByDriverId(tripRequest.getDriverId());
                for (Shift driverShift : driverShifts) {
                    if (hasTimeOverlap(driverShift, request)) {
                        throw new RuntimeException("Tài xế đã có ca khác trong thời gian này");
                    }
                }
            }

            // Kiểm tra xung đột xe
            for (CreateShiftRequest.TripRequest tripRequest : request.getTrips()) {
                if (tripRequest.getVehicleId() != null) {
                    List<Shift> vehicleShifts = shiftRepository.findByVehicleId(tripRequest.getVehicleId());
                    for (Shift vehicleShift : vehicleShifts) {
                        if (hasTimeOverlap(vehicleShift, request)) {
                            throw new RuntimeException("Xe đã được gán cho ca khác trong thời gian này");
                        }
                    }
                }
            }
        }
    }

    /**
     * Kiểm tra 2 khoảng thời gian có chồng lấp không
     */
    private boolean hasTimeOverlap(Shift shift, CreateShiftRequest request) {
        return !(shift.getEndTime().isBefore(request.getStartTime()) ||
                shift.getStartTime().isAfter(request.getEndTime()));
    }

    /**
     * Lấy tất cả ca
     */
    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }

    /**
     * Lấy ca theo ID
     */
    public Optional<Shift> getShiftById(Long id) {
        return shiftRepository.findById(id);
    }

    /**
     * Lấy ca theo trạng thái
     */
    public List<Shift> getShiftsByStatus(Shift.ShiftStatus status) {
        return shiftRepository.findByStatus(status);
    }

    /**
     * Lấy ca theo loại
     */
    public List<Shift> getShiftsByType(Shift.ShiftType shiftType) {
        return shiftRepository.findByShiftType(shiftType);
    }

    /**
     * Cập nhật trạng thái ca
     */
    @Transactional
    public Shift updateShiftStatus(Long shiftId, Shift.ShiftStatus newStatus) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Ca không tồn tại"));

        shift.setStatus(newStatus);
        return shiftRepository.save(shift);
    }

    /**
     * Tài xế xác nhận tham gia chuyến đi
     */
    @Transactional
    public void confirmDriverParticipation(Long tripId, Long driverId) {
        BusTrip trip = busTripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Chuyến đi không tồn tại"));

        if (!trip.getDriver().getId().equals(driverId)) {
            throw new RuntimeException("Bạn không phải tài xế của chuyến đi này");
        }

        trip.setDriverConfirmed(true);
        busTripRepository.save(trip);

        // Kiểm tra xem tất cả tài xế đã xác nhận chưa
        Shift shift = trip.getShift();
        if (shift.isAllDriversConfirmed()) {
            shift.setStatus(Shift.ShiftStatus.SAN_SANG_CHAY);
            shiftRepository.save(shift);
        }
    }

    /**
     * Tài xế từ chối tham gia chuyến đi
     */
    @Transactional
    public void rejectDriverParticipation(Long tripId, Long driverId) {
        BusTrip trip = busTripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Chuyến đi không tồn tại"));

        if (!trip.getDriver().getId().equals(driverId)) {
            throw new RuntimeException("Bạn không phải tài xế của chuyến đi này");
        }

        // Xóa chuyến đi và cập nhật ca
        busTripRepository.delete(trip);

        Shift shift = trip.getShift();
        List<BusTrip> remainingTrips = busTripRepository.findByShift(shift);

        if (remainingTrips.isEmpty()) {
            // Không còn chuyến đi nào, hủy ca
            shift.setStatus(Shift.ShiftStatus.BI_HUY);
        } else {
            // Vẫn còn chuyến đi khác, chuyển về trạng thái chờ xác nhận
            shift.setStatus(Shift.ShiftStatus.CHO_XAC_NHAN);
        }

        shiftRepository.save(shift);
    }

    /**
     * Lấy ca của tài xế
     */
    public List<Shift> getShiftsByDriver(Long driverId) {
        return shiftRepository.findByDriverId(driverId);
    }

    /**
     * Lấy ca hiện tại
     */
    public List<Shift> getCurrentShifts() {
        return shiftRepository.findCurrentShifts(LocalDateTime.now());
    }

    /**
     * Lấy ca sắp tới
     */
    public List<Shift> getUpcomingShifts() {
        return shiftRepository.findUpcomingShifts(LocalDateTime.now());
    }
}