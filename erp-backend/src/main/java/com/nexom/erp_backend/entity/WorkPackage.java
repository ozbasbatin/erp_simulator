package com.nexom.erp_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "work_packages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "package_no", unique = true, nullable = false)
    private String packageNo;

    @Column(name = "quality_notes", columnDefinition = "TEXT")
    private String qualityNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "delivery_date")
    private String deliveryDate;

    @Column(name = "order_date")
    private String orderDate;

    @Column(name = "is_cancelled")
    private Boolean isCancelled = false;

    // Paket silindiğinde içindeki parçaların da otomatik silinmesi için (Cascade)
    @OneToMany(mappedBy = "workPackage", cascade = CascadeType.REMOVE)
    @JsonIgnore
    private List<Part> parts = new ArrayList<>();
}