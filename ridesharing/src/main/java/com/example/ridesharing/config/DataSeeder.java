package com.example.ridesharing.config;

import com.example.ridesharing.model.*;
import com.example.ridesharing.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalTime;
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

    @PostConstruct
    public void seedData() {
        // Seed BusStations
        if (busStationRepository.count() == 0) {
            BusStation u = new BusStation();
            u.setCode("U");
            u.setName("Khu U");
            u.setAddress("31/36 Ung Văn Khiêm, Bình Thạnh");
            u.setLatitude(10.8150);
            u.setLongitude(106.7000);

            BusStation ab = new BusStation();
            ab.setCode("AB");
            ab.setName("Khu AB");
            ab.setAddress("475A Điện Biên Phủ, Bình Thạnh");
            ab.setLatitude(10.8008);
            ab.setLongitude(106.7212);

            BusStation e = new BusStation();
            e.setCode("E");
            e.setName("Khu E");
            e.setAddress("Lô E1/E2, Khu Công nghệ cao Sài Gòn, TP. Thủ Đức");
            e.setLatitude(10.8544);
            e.setLongitude(106.7966);

            BusStation r = new BusStation();
            r.setCode("R");
            r.setName("Khu R");
            r.setAddress("Lô R, Khu Công nghệ cao, TP. Thủ Đức");
            r.setLatitude(10.8544);
            r.setLongitude(106.7966);

            busStationRepository.saveAll(Arrays.asList(u, ab, e, r));
        }

        // Seed BusRoute
        if (busRouteRepository.count() == 0) {
            BusRoute route = new BusRoute();
            route.setName("Tuyến khép kín U-AB-E-R-U");
            busRouteRepository.save(route);
        }

        // Seed BusSchedule
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

            User driver = new User();
            driver.setName("Nguyễn Văn Tài");
            driver.setEmail("driver@hutech.edu.vn");
            driver.setPassword("driver123");
            driver.setRole("DRIVER");

            User student = new User();
            student.setName("Trần Thị Sinh Viên");
            student.setEmail("student@hutech.edu.vn");
            student.setPassword("student123");
            student.setRole("USER");

            userRepository.saveAll(Arrays.asList(admin, driver, student));
        }

        // Seed Vehicles
        if (vehicleRepository.count() == 0) {
            Vehicle v1 = new Vehicle();
            v1.setLicensePlate("51B-12345");
            v1.setSeats(30);
            Vehicle v2 = new Vehicle();
            v2.setLicensePlate("51B-67890");
            v2.setSeats(30);
            vehicleRepository.saveAll(Arrays.asList(v1, v2));
        }
    }
}