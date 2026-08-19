package com.nexom.erp_backend.repository;

import com.nexom.erp_backend.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MachineRepository extends JpaRepository<Machine, Long> {
}