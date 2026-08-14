package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.Part;
import com.nexom.erp_backend.entity.PartStatus;
import com.nexom.erp_backend.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PartController {

    private final PartRepository partRepository;

    @GetMapping
    public List<Part> getAllParts() {
        return partRepository.findAll();
    }

    @PostMapping
    public Part addPart(@RequestBody Part part) {
        return partRepository.save(part);
    }

    // Duruma göre parça filtreleme (Örn: Sadece BEKLIYOR olanlar)
    @GetMapping("/status/{status}")
    public List<Part> getPartsByStatus(@PathVariable PartStatus status) {
        return partRepository.findByStatus(status);
    }

    // Parçanın durumunu güncelleme (PUT isteği)
    @PutMapping("/{id}/status")
    public Part updatePartStatus(@PathVariable Long id, @RequestParam PartStatus status) {
        // Önce id'ye göre parçayı veritabanından buluyoruz
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parça bulunamadı!"));

        // Parçanın yeni durumunu ayarlıyoruz
        part.setStatus(status);

        // Güncellenmiş haliyle veritabanına tekrar kaydediyoruz
        return partRepository.save(part);
    }

    @DeleteMapping("/{id}")
    public void deletePart(@PathVariable Long id) {
        partRepository.deleteById(id);
    }
}