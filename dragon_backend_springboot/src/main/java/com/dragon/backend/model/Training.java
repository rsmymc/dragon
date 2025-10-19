package com.dragon.backend.model;

import com.dragon.backend.model.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "training", indexes = {
        @Index(name = "idx_training_team_start", columnList = "team_id, start_at"),
        @Index(name = "idx_training_start", columnList = "start_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Training extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Override
    public String toString() {
        return "Training — " + (team != null ? team.getName() : "?") + " @ " + startAt;
    }
}