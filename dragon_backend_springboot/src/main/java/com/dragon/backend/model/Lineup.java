package com.dragon.backend.model;

import com.dragon.backend.model.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lineup", indexes = {
        @Index(name = "idx_lineup_state", columnList = "state")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lineup extends BaseEntity {

    public enum State {
        DRAFT(1, "Draft"),
        PUBLISHED(2, "Published");

        private final int value;
        private final String label;

        State(int value, String label) {
            this.value = value;
            this.label = label;
        }

        public int getValue() {
            return value;
        }

        public String getLabel() {
            return label;
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "training_id", nullable = false, unique = true)
    private Training training;

    @Enumerated(EnumType.ORDINAL)
    @Column(nullable = false)
    private State state = State.DRAFT;

    @Override
    public String toString() {
        return "Lineup #" + id + " for training " +
                (training != null ? training.getId() : "?") +
                " (state=" + state.getLabel() + ")";
    }
}