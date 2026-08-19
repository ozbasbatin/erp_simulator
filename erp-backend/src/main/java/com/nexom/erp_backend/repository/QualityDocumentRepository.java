package com.nexom.erp_backend.repository;

import com.nexom.erp_backend.entity.QualityDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QualityDocumentRepository extends JpaRepository<QualityDocument, Long> {
    List<QualityDocument> findByPartId(Long partId);
    List<QualityDocument> findByWorkPackageId(Long workPackageId);
}