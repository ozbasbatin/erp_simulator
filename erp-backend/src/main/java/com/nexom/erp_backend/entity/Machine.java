package com.nexom.erp_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "machines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "maintenance_date")
    private String maintenanceDate;

    @Column(name = "maintenance_note", columnDefinition = "TEXT")
    private String maintenanceNote;

    @Column(name = "operator_name")
    private String operatorName;
}