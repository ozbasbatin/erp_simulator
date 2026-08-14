package com.nexom.erp_backend.repository;

import com.nexom.erp_backend.entity.WorkPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkPackageRepository extends JpaRepository<WorkPackage, Long> {
    Optional<WorkPackage> findByPackageNo(String packageNo);
}