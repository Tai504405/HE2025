package com.example.ridesharing.config;

import com.example.ridesharing.model.*;
import com.example.ridesharing.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder {
    @Autowired
    private BusStationRepository busStationRepository;
    @Autowired
    private BusRouteRepository busRouteRepository;
    @Autowired
    private BusScheduleRepository busScheduleRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VehicleRepository vehicleRepository;
    @Autowired
    private BusTripRepository busTripRepository;

    @PostConstruct
    public void seedData() {
        // Seed BusStations
        if (busStationRepository.count() == 0) {
            BusStation stationU = new BusStation();
            stationU.setCode("U");
            stationU.setName("Trạm U");
            stationU.setAddress("475A Điện Biên Phủ, Bình Thạnh, TP.HCM");
            stationU.setLatitude(10.8014);
            stationU.setLongitude(106.7148);

            BusStation stationAB = new BusStation();
            stationAB.setCode("AB");
            stationAB.setName("Trạm AB");
            stationAB.setAddress("475B Điện Biên Phủ, Bình Thạnh, TP.HCM");
            stationAB.setLatitude(10.8020);
            stationAB.setLongitude(106.7150);

            BusStation stationE = new BusStation();
            stationE.setCode("E");
            stationE.setName("Trạm E");
            stationE.setAddress("475C Điện Biên Phủ, Bình Thạnh, TP.HCM");
            stationE.setLatitude(10.8025);
            stationE.setLongitude(106.7155);

            BusStation stationR = new BusStation();
            stationR.setCode("R");
            stationR.setName("Trạm R");
            stationR.setAddress("475D Điện Biên Phủ, Bình Thạnh, TP.HCM");
            stationR.setLatitude(10.8030);
            stationR.setLongitude(106.7160);

            busStationRepository.saveAll(Arrays.asList(stationU, stationAB, stationE, stationR));
        }

        // Seed BusRoutes
        if (busRouteRepository.count() == 0) {
            BusRoute route = new BusRoute();
            route.setName("Tuyến HUTECH - Quận 1");
            busRouteRepository.save(route);
        }

        // Seed BusSchedules
        if (busScheduleRepository.count() == 0) {
            BusRoute route = busRouteRepository.findAll().get(0);
            BusSchedule morning = new BusSchedule();
            morning.setRoute(route);
            morning.setStartTime(LocalTime.of(6, 40));
            morning.setEndTime(LocalTime.of(7, 20));
            morning.setType("Sáng");
            morning.setNumberOfTrips(2);

            BusSchedule noon = new BusSchedule();
            noon.setRoute(route);
            noon.setStartTime(LocalTime.of(11, 10));
            noon.setEndTime(LocalTime.of(12, 10));
            noon.setType("Trưa");
            noon.setNumberOfTrips(2);

            BusSchedule evening = new BusSchedule();
            evening.setRoute(route);
            evening.setStartTime(LocalTime.of(16, 10));
            evening.setEndTime(LocalTime.of(16, 50));
            evening.setType("Chiều");
            evening.setNumberOfTrips(2);

            busScheduleRepository.saveAll(Arrays.asList(morning, noon, evening));
        }

        // Seed Users
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setName("Admin");
            admin.setEmail("admin@hutech.edu.vn");
            admin.setPassword("admin123"); // Nên mã hóa mật khẩu ở production
            admin.setRole("ADMIN");

            User driver1 = new User();
            driver1.setName("Nguyễn Văn Tài");
            driver1.setEmail("driver@hutech.edu.vn");
            driver1.setPassword("driver123");
            driver1.setRole("DRIVER");

            User driver2 = new User();
            driver2.setName("Trần Văn Lái");
            driver2.setEmail("driver2@hutech.edu.vn");
            driver2.setPassword("driver123");
            driver2.setRole("DRIVER");

            User student = new User();
            student.setName("Trần Thị Sinh Viên");
            student.setEmail("student@hutech.edu.vn");
            student.setPassword("student123");
            student.setRole("USER");

            userRepository.saveAll(Arrays.asList(admin, driver1, driver2, student));
        }

        // Seed Vehicles
        if (vehicleRepository.count() == 0) {
            User driver1 = userRepository.findByRole("DRIVER").get(0);
            User driver2 = userRepository.findByRole("DRIVER").get(1);

            Vehicle vehicle1 = new Vehicle();
            vehicle1.setVehicleCode("BUS001");
            vehicle1.setLicensePlate("51A-12345");
            vehicle1.setSeats(45);
            vehicle1.setType("Xe buýt 45 chỗ");
            vehicle1.setStatus("ACTIVE");
            vehicle1.setNotes("Xe mới, đầy đủ tiện nghi");
            vehicle1.setDriver(driver1);

            Vehicle vehicle2 = new Vehicle();
            vehicle2.setVehicleCode("BUS002");
            vehicle2.setLicensePlate("51B-67890");
            vehicle2.setSeats(30);
            vehicle2.setType("Xe buýt 30 chỗ");
            vehicle2.setStatus("ACTIVE");
            vehicle2.setNotes("Xe cũ, cần bảo trì định kỳ");
            vehicle2.setDriver(driver2);

            Vehicle vehicle3 = new Vehicle();
            vehicle3.setVehicleCode("BUS003");
            vehicle3.setLicensePlate("51C-11111");
            vehicle3.setSeats(25);
            vehicle3.setType("Xe buýt 25 chỗ");
            vehicle3.setStatus("MAINTENANCE");
            vehicle3.setNotes("Đang bảo trì");
            vehicle3.setDriver(null);

            vehicleRepository.saveAll(Arrays.asList(vehicle1, vehicle2, vehicle3));
        }

        // Seed BusTrips
        if (busTripRepository.count() == 0) {
            List<BusSchedule> schedules = busScheduleRepository.findAll();
            List<User> drivers = userRepository.findByRole("DRIVER");
            List<Vehicle> vehicles = vehicleRepository.findAll();
            List<BusStation> stations = busStationRepository.findAll();

            if (!schedules.isEmpty() && !drivers.isEmpty() && !vehicles.isEmpty() && !stations.isEmpty()) {
                // Tạo chuyến đi sáng
                BusTrip morningTrip = new BusTrip();
                morningTrip.setSchedule(schedules.get(0)); // Sáng
                morningTrip.setDriver(drivers.get(0));
                morningTrip.setVehicle(vehicles.get(0));
                morningTrip.setStatus("WAITING");
                morningTrip.setCurrentStation(stations.get(0));
                morningTrip.setSeatsTotal(45);
                morningTrip.setSeatsAvailable(45);
                morningTrip.setStartedAt(LocalDateTime.now().plusHours(1));
                morningTrip.setCurrentStatus("IDLE");
                morningTrip.setNotes("Chuyến đi sáng thường xuyên");

                // Tạo chuyến đi trưa
                BusTrip noonTrip = new BusTrip();
                noonTrip.setSchedule(schedules.get(1)); // Trưa
                noonTrip.setDriver(drivers.get(1));
                noonTrip.setVehicle(vehicles.get(1));
                noonTrip.setStatus("BOARDING");
                noonTrip.setCurrentStation(stations.get(1));
                noonTrip.setSeatsTotal(30);
                noonTrip.setSeatsAvailable(25);
                noonTrip.setStartedAt(LocalDateTime.now().plusMinutes(30));
                noonTrip.setCurrentStatus("READY");
                noonTrip.setNotes("Chuyến đi trưa đông khách");

                // Tạo chuyến đi chiều
                BusTrip eveningTrip = new BusTrip();
                eveningTrip.setSchedule(schedules.get(2)); // Chiều
                eveningTrip.setDriver(drivers.get(0));
                eveningTrip.setVehicle(vehicles.get(0));
                eveningTrip.setStatus("RUNNING");
                eveningTrip.setCurrentStation(stations.get(2));
                eveningTrip.setSeatsTotal(45);
                eveningTrip.setSeatsAvailable(40);
                eveningTrip.setStartedAt(LocalDateTime.now().minusMinutes(15));
                eveningTrip.setCurrentStatus("MOVING");
                eveningTrip.setCurrentLat(10.8020);
                eveningTrip.setCurrentLng(106.7150);
                eveningTrip.setNotes("Chuyến đi chiều về");

                busTripRepository.saveAll(Arrays.asList(morningTrip, noonTrip, eveningTrip));
            }
        }
    }
}