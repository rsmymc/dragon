package com.dragon.backend.model;

import com.dragon.backend.model.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lineup_seat",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_lineup_side_seat", columnNames = {"lineup_id", "side", "seat_number"}),
                @UniqueConstraint(name = "uq_lineup_person_once", columnNames = {"lineup_id", "person_id"})
        },
        indexes = {
                @Index(name = "idx_lineup_seat_lineup_side", columnList = "lineup_id, side"),
                @Index(name = "idx_lineup_seat_lineup_person", columnList = "lineup_id, person_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineupSeat extends BaseEntity {

    public enum Side {
        L("Left"),
        R("Right");

        private final String label;

        Side(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lineup_id", nullable = false)
    private Lineup lineup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id")
    private Person person;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 1)
    private Side side;

    @Column(name = "seat_number", nullable = false)
    private Short seatNumber;

    @Override
    public String toString() {
        String who = person != null ? person.toString() : "empty";
        return "[" + side + seatNumber + "] in lineup " +
                (lineup != null ? lineup.getId() : "?") + " -> " + who;
    }
}