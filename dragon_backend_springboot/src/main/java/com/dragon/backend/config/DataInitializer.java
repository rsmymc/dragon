/*
package com.dragon.backend.config;

import com.dragon.backend.model.User;
import com.dragon.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

   */
/* private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create default superuser if not exists
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@dragon.com")
                    .password(passwordEncoder.encode("admin123"))  // Change this password!
                    .isStaff(true)
                    .isSuperuser(true)
                    .isActive(true)
                    .build();

            userRepository.save(admin);
            log.info("✅ Superuser created: username=admin, password=admin123");
            log.warn("⚠️  IMPORTANT: Change the default admin password in production!");
        } else {
            log.info("Superuser already exists, skipping creation.");
        }
    }*//*

}*/
