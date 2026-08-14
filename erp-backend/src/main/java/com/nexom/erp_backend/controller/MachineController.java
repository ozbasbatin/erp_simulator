package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.Machine;
import com.nexom.erp_backend.repository.MachineRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
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

    @PutMapping("/{id}")
    public ResponseEntity<Machine> updateMachine(@PathVariable Long id, @RequestBody Machine machineDetails) {
        return machineRepository.findById(id)
                .map(machine -> {
                    machine.setName(machineDetails.getName());
                    machine.setMaintenanceDate(machineDetails.getMaintenanceDate());
                    machine.setMaintenanceNote(machineDetails.getMaintenanceNote());
                    // Operatör ismini güncelliyoruz
                    machine.setOperatorName(machineDetails.getOperatorName());

                    Machine updatedMachine = machineRepository.save(machine);
                    return ResponseEntity.ok(updatedMachine);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}