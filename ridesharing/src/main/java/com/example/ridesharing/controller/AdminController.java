package com.example.ridesharing.controller;

import com.example.ridesharing.model.User;
import com.example.ridesharing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        Optional<User> optional = userRepository.findById(id);
        if (optional.isEmpty())
            return ResponseEntity.notFound().build();
        User u = optional.get();
        u.setName(user.getName());
        u.setEmail(user.getEmail());
        u.setPassword(user.getPassword());
        u.setRole(user.getRole());
        return ResponseEntity.ok(userRepository.save(u));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id))
            return ResponseEntity.notFound().build();
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}