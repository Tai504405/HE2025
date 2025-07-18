package com.example.ridesharing.controller;

import com.example.ridesharing.model.User;
import com.example.ridesharing.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<User> getUsers(@RequestParam(value = "role", required = false) String role) {
        if (role != null) {
            return userRepository.findByRole(role);
        }
        return userRepository.findAll();
    }
}