package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.Machine;
import com.nexom.erp_backend.repository.MachineRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/machines")
@CrossOrigin(origins = "*") // İleride frontend'den gelen isteklere izin vermek için
@RequiredArgsConstructor
public class MachineController {

    private final MachineRepository machineRepository;

    // Tüm makineleri listeleme (GET isteği)
    @GetMapping
    public List<Machine> getAllMachines() {
        return machineRepository.findAll();
    }

    // Yeni makine ekleme (POST isteği)
    @PostMapping
    public Machine addMachine(@RequestBody Machine machine) {
        return machineRepository.save(machine);
    }

    @DeleteMapping("/{id}")
    public void deleteMachine(@PathVariable Long id) {
        machineRepository.deleteById(id);
    }
}