package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.User;
import com.nexom.erp_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*") // Ön yüzden gelecek isteklere kapıyı açıyoruz
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // Sistemdeki tüm personeli listele (GET)
    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Sisteme yeni personel ekle (POST)
    @PostMapping
    public User addUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    // YENİ: Kullanıcı Giriş (Login) Endpoint'i
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        Optional<User> userOpt = userRepository.findByUsername(username);

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            User user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "role", user.getRole().name(),
                    "username", user.getUsername()));
        } else {
            return ResponseEntity.status(401).body(Map.of(
                    "status", "error",
                    "message", "Hatalı kullanıcı adı veya şifre!"));
        }
    }
}