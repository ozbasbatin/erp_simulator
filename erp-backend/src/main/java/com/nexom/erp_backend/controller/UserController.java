package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.User;
import com.nexom.erp_backend.entity.Role;
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

    // ===================================================
    // ÇALIŞAN YÖNETİMİ (SADECE ADMIN KULLANACAK)
    // ===================================================

    // 1. Admin Hariç Tüm Çalışanları Getir
    @GetMapping("/staff")
    public ResponseEntity<List<User>> getAllStaff() {
        // Admini listede göstermeye gerek yok, diğerlerini filtrele
        List<User> staff = userRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.ADMIN)
                .toList();
        return ResponseEntity.ok(staff);
    }

    // 2. Yeni Çalışan Ekle (Üretim, Kalite veya Operatör)
    @PostMapping("/staff")
    public ResponseEntity<User> addStaff(@RequestBody User newUser) {
        // Eğer eklenen kişi OPERATOR ise şifreye ihtiyacı yok, tire koyup geçiyoruz
        if (newUser.getRole() == Role.OPERATOR) {
            newUser.setPassword("-");
        }
        User savedStaff = userRepository.save(newUser);
        return ResponseEntity.ok(savedStaff);
    }

    // 3. Çalışanı Sil
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}