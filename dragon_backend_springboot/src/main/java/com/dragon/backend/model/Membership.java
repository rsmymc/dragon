package com.dragon.backend.model;

import com.dragon.backend.model.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "person_team",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_person_team_once", columnNames = {"person_id", "team_id"})
        },
        indexes = {
                @Index(name = "idx_membership_team", columnList = "team_id"),
                @Index(name = "idx_membership_person", columnList = "person_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Membership extends BaseEntity {

    public enum Role {
        PLAYER(1, "Player"),
        CAPTAIN(2, "Captain"),
        COACH(3, "Coach"),
        MANAGER(4, "Manager");

        private final int value;
        private final String label;

        Role(int value, String label) {
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
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Enumerated(EnumType.ORDINAL)
    @Column(nullable = false)
    private Role role = Role.PLAYER;

    @Override
    public String toString() {
        return person + " @ " + team + " (" + role.getLabel() + ")";
    }
}