package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.User;
import com.nexom.erp_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}