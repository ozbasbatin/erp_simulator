package com.nexom.erp_backend.repository;

import com.nexom.erp_backend.entity.Role;
import com.nexom.erp_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    List<User> findByRole(Role role);
}