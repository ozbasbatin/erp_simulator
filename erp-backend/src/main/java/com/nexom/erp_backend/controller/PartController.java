package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.Part;
import com.nexom.erp_backend.entity.PartStatus;
import com.nexom.erp_backend.repository.PartRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    // Parça Güncelleme (PUT İsteğini Karşılayan Metod)
    @PutMapping("/{id}")
    public ResponseEntity<Part> updatePart(@PathVariable Long id, @RequestBody Part updatedPart) {
        try {
            Part existingPart = partRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Parça bulunamadı: " + id));

            // Alanları güncelle
            existingPart.setProducedQuantity(updatedPart.getProducedQuantity());
            existingPart.setDrawingPath(updatedPart.getDrawingPath());
            existingPart.setStatus(updatedPart.getStatus());
            existingPart.setPostProcess(updatedPart.getPostProcess());
            existingPart.setQualityRequirements(updatedPart.getQualityRequirements());
            existingPart.setWaybillNumber(updatedPart.getWaybillNumber());
            existingPart.setQualityDocPath(updatedPart.getQualityDocPath());
            existingPart.setQueueOrder(updatedPart.getQueueOrder());

            // İlişkileri koruyarak kaydet
            if (updatedPart.getMachine() != null) {
                existingPart.setMachine(updatedPart.getMachine());
            }
            if (updatedPart.getWorkPackage() != null) {
                existingPart.setWorkPackage(updatedPart.getWorkPackage());
            }
            if (updatedPart.getOperator() != null) {
                existingPart.setOperator(updatedPart.getOperator());
            }

            Part savedPart = partRepository.save(existingPart);
            return ResponseEntity.ok(savedPart);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public void deletePart(@PathVariable Long id) {
        partRepository.deleteById(id);
    }
}