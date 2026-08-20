package com.nexom.erp_backend.repository;

import com.nexom.erp_backend.entity.Part;
import com.nexom.erp_backend.entity.PartStatus;
import com.nexom.erp_backend.entity.PostProcess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface PartRepository extends JpaRepository<Part, Long> {

    @Override
    @Query("SELECT p FROM Part p " +
            "LEFT JOIN FETCH p.machine " +
            "LEFT JOIN FETCH p.workPackage wp " +
            "LEFT JOIN FETCH wp.customer " +
            "LEFT JOIN FETCH p.operator")
    List<Part> findAll();

    List<Part> findByWorkPackageId(Long workPackageId);

    List<Part> findByMachineIdAndStatus(Long machineId, PartStatus status);

    List<Part> findByStatus(PartStatus status);

    List<Part> findByPostProcess(PostProcess postProcess);
}