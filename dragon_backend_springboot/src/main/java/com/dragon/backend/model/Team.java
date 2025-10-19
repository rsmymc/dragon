package com.dragon.backend.model;

import com.dragon.backend.model.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "team")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    private String city;

    @Column(name = "max_members", nullable = false)
    private Integer maxMembers = 22;

    @Override
    public String toString() {
        return name + " (" + id + ")";
    }
}