package com.nexom.erp_backend.repository;

import com.nexom.erp_backend.entity.WorkPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WorkPackageRepository extends JpaRepository<WorkPackage, Long> {
    Optional<WorkPackage> findByPackageNo(String packageNo);
}