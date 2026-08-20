package com.nexom.erp_backend.repository;

import com.nexom.erp_backend.entity.WorkPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface WorkPackageRepository extends JpaRepository<WorkPackage, Long> {

    @Override
    @Query("SELECT wp FROM WorkPackage wp LEFT JOIN FETCH wp.customer")
    List<WorkPackage> findAll();

    Optional<WorkPackage> findByPackageNo(String packageNo);
}