package com.nexom.erp_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "parts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = true) // Eskiden zorunluysa optional = false olabilir, true yapıyoruz
    @JoinColumn(name = "work_package_id", nullable = true) // nullable = true yaptık
    private WorkPackage workPackage;

    @ManyToOne
    @JoinColumn(name = "machine_id")
    private Machine machine;

    @ManyToOne
    @JoinColumn(name = "operator_id")
    private User operator; // Hangi operatörün ürettiğini tutacağımız yeni alan

    @Column(name = "part_no", nullable = false)
    private String partNo;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "produced_quantity")
    private Integer producedQuantity = 0;

    @Column(name = "estimated_time")
    private Double estimatedTime;

    @Column(name = "drawing_path")
    private String drawingPath;

    @Column(name = "quality_doc_path")
    private String qualityDocPath;

    @Enumerated(EnumType.STRING)
    private PartStatus status = PartStatus.BEKLIYOR;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_process")
    private PostProcess postProcess;

    @Column(name = "queue_order")
    private Integer queueOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "delivery_date")
    private LocalDateTime deliveryDate;

    @Column(name = "raw_material")
    private String rawMaterial;

    @Column(name = "has_coating")
    private Boolean hasCoating = false;
}