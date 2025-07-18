package com.example.ridesharing.controller;

import com.example.ridesharing.model.TripRegistration;
import com.example.ridesharing.model.BusTrip;
import com.example.ridesharing.repository.TripRegistrationRepository;
import com.example.ridesharing.repository.BusTripRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

@RestController
@RequestMapping("/api/qr")
public class QRCodeScanController {
    @Autowired
    private TripRegistrationRepository tripRegistrationRepository;
    @Autowired
    private BusTripRepository busTripRepository;

    @PostMapping("/scan")
    public ResponseEntity<?> scanQRCode(@RequestBody String qrCode) {
        try {
            String decoded = new String(Base64.getDecoder().decode(qrCode), StandardCharsets.UTF_8);
            String[] parts = decoded.split(":");
            if (parts.length != 3)
                return ResponseEntity.badRequest().body("QR không hợp lệ");
            Long regId = Long.parseLong(parts[0]);
            Optional<TripRegistration> regOpt = tripRegistrationRepository.findById(regId);
            if (regOpt.isEmpty())
                return ResponseEntity.badRequest().body("Không tìm thấy đăng ký");
            TripRegistration reg = regOpt.get();
            if ("BOARDED".equals(reg.getStatus()))
                return ResponseEntity.badRequest().body("Đã lên xe");
            reg.setStatus("BOARDED");
            tripRegistrationRepository.save(reg);
            BusTrip trip = reg.getTrip();
            if (trip.getSeatsAvailable() > 0) {
                trip.setSeatsAvailable(trip.getSeatsAvailable() - 1);
                busTripRepository.save(trip);
            }
            return ResponseEntity.ok("Quét thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("QR không hợp lệ");
        }
    }
}