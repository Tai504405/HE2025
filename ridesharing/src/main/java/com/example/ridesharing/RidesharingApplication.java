package com.example.ridesharing;

import com.example.ridesharing.model.User;
import com.example.ridesharing.model.Vehicle;
import com.example.ridesharing.model.Trip;
import com.example.ridesharing.repository.UserRepository;
import com.example.ridesharing.repository.VehicleRepository;
import com.example.ridesharing.repository.TripRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class RidesharingApplication {

	public static void main(String[] args) {
		SpringApplication.run(RidesharingApplication.class, args);
	}

	@Bean
	CommandLineRunner initData(UserRepository userRepo, VehicleRepository vehicleRepo, TripRepository tripRepo) {
		return args -> {
			// Tạo user mẫu nếu chưa có
			User admin = userRepo.findByEmail("admin@example.com").orElseGet(
					() -> userRepo.save(new User("admin@example.com", "Quản trị viên", "admin123", "ADMIN")));
			User driver = userRepo.findByEmail("driver@example.com").orElseGet(
					() -> userRepo.save(new User("driver@example.com", "Tài xế Nguyễn Văn A", "driver123", "DRIVER")));
			User driver2 = userRepo.findByEmail("driver2@example.com").orElseGet(
					() -> userRepo.save(new User("driver2@example.com", "Tài xế Lê Thị B", "driver123", "DRIVER")));

			// Tạo phương tiện mẫu cho tài xế nếu chưa có
			if (vehicleRepo.findByOwnerId(driver.getId()).isEmpty()) {
				vehicleRepo.save(new Vehicle("51A-12345", "4 chỗ", "Toyota", driver.getId()));
				vehicleRepo.save(new Vehicle("59B-67890", "7 chỗ", "Kia", driver.getId()));
			}
			if (vehicleRepo.findByOwnerId(driver2.getId()).isEmpty()) {
				vehicleRepo.save(new Vehicle("60C-11111", "16 chỗ", "Ford", driver2.getId()));
			}
			if (vehicleRepo.findByOwnerId(admin.getId()).isEmpty()) {
				vehicleRepo.save(new Vehicle("30F-88888", "Xe buýt", "Hyundai", admin.getId()));
			}

			// Tạo chuyến đi mẫu tiếng Việt nếu chưa có
			if (tripRepo.findAll().isEmpty()) {
				tripRepo.save(new Trip(
						null,
						driver.getId(),
						"Hà Nội",
						"Hồ Chí Minh",
						LocalDateTime.of(2025, 7, 19, 15, 0),
						3,
						vehicleRepo.findByOwnerId(driver.getId()).get(0).getId(),
						"CREATED",
						21.028511, 105.804817, // Hà Nội
						10.776889, 106.700806 // Hồ Chí Minh
				));
				tripRepo.save(new Trip(
						null,
						driver2.getId(),
						"Đồng Tháp",
						"Cần Thơ",
						LocalDateTime.of(2025, 7, 20, 8, 30),
						10,
						vehicleRepo.findByOwnerId(driver2.getId()).get(0).getId(),
						"CREATED",
						10.465, 106.438, // Đồng Tháp
						10.0452, 105.7469 // Cần Thơ
				));
			}
		};
	}
}
