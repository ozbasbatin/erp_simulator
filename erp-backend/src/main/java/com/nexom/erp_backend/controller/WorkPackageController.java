package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.WorkPackage;
import com.nexom.erp_backend.repository.WorkPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/work-packages")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class WorkPackageController {

    private final WorkPackageRepository workPackageRepository;

    @GetMapping
    public List<WorkPackage> getAllWorkPackages() {
        return workPackageRepository.findAll();
    }

    @PostMapping
    public WorkPackage addWorkPackage(@RequestBody WorkPackage workPackage) {
        return workPackageRepository.save(workPackage);
    }

    @DeleteMapping("/{id}")
    public void deleteWorkPackage(@PathVariable Long id) {
        workPackageRepository.deleteById(id);
    }
}