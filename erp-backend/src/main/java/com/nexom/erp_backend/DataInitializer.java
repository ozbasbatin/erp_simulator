package com.nexom.erp_backend;

import com.nexom.erp_backend.entity.Role;
import com.nexom.erp_backend.entity.User;
import com.nexom.erp_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        // Eğer veritabanında hiç kullanıcı yoksa varsayılan hesapları otomatik oluştur
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword("123");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            User uretim = new User();
            uretim.setUsername("uretim");
            uretim.setPassword("123");
            uretim.setRole(Role.PRODUCTION);
            userRepository.save(uretim);

            User kalite = new User();
            kalite.setUsername("kalite");
            kalite.setPassword("123");
            kalite.setRole(Role.QUALITY);
            userRepository.save(kalite);

            System.out.println("✅ Varsayılan Admin, Üretim ve Kalite kullanıcıları veritabanına otomatik eklendi!");
        }
    }
}