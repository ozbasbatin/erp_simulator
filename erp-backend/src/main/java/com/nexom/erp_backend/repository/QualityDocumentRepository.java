package com.nexom.erp_backend.repository;

import com.nexom.erp_backend.entity.QualityDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QualityDocumentRepository extends JpaRepository<QualityDocument, Long> {
    List<QualityDocument> findByPartId(Long partId);
    List<QualityDocument> findByWorkPackageId(Long workPackageId);
}