package com.nexom.erp_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_packages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_no", unique = true, nullable = false)
    private String packageNo;

    @Column(name = "quality_notes", columnDefinition = "TEXT")
    private String qualityNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}