package com.example.ridesharing.controller;

import com.example.ridesharing.model.TripRegistration;
import com.example.ridesharing.repository.TripRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

@RestController
@RequestMapping("/api/qr")
public class QRCodeController {
    @Autowired
    private TripRegistrationRepository tripRegistrationRepository;

    @GetMapping("/{registrationId}")
    public String getQRCode(@PathVariable Long registrationId) {
        Optional<TripRegistration> regOpt = tripRegistrationRepository.findById(registrationId);
        if (regOpt.isEmpty())
            return "";
        TripRegistration reg = regOpt.get();
        String raw = reg.getId() + ":" + reg.getUser().getId() + ":" + reg.getTrip().getId();
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }
}