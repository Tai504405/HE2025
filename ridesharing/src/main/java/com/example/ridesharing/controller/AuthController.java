package com.example.ridesharing.controller;

import com.example.ridesharing.model.User;
import com.example.ridesharing.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        User created = userService.registerUser(user);
        if (created == null) {
            return ResponseEntity.badRequest().body("Email đã tồn tại");
        }
        return ResponseEntity.ok(created);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        User user = userService.loginUser(loginRequest.getEmail(), loginRequest.getPassword());
        if (user == null) {
            return ResponseEntity.status(401).body("Sai email hoặc mật khẩu");
        }
        return ResponseEntity.ok(user);
    }
}
