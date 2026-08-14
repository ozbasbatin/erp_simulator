package com.nexom.erp_backend.controller;

import com.nexom.erp_backend.entity.QualityDocument;
import com.nexom.erp_backend.repository.QualityDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quality-documents")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class QualityDocumentController {

    private final QualityDocumentRepository qualityDocumentRepository;

    // Tüm belgeleri listele (GET)
    @GetMapping
    public List<QualityDocument> getAllDocuments() {
        return qualityDocumentRepository.findAll();
    }

    // Yeni belge kaydı ekle (POST)
    @PostMapping
    public QualityDocument addDocument(@RequestBody QualityDocument document) {
        return qualityDocumentRepository.save(document);
    }

    // Belirli bir parçaya ait belgeleri getir (Örn: Sadece PRT-9901'in kalite kontrol raporları)
    @GetMapping("/part/{partId}")
    public List<QualityDocument> getDocumentsByPartId(@PathVariable Long partId) {
        return qualityDocumentRepository.findByPartId(partId);
    }
}