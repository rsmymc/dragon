package com.dragon.backend.model;

import com.dragon.backend.model.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "person", indexes = {
        @Index(name = "idx_person_phone", columnList = "phone"),
        @Index(name = "idx_person_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Person extends BaseEntity {

    public enum Side {
        BOTH(0, "Both"),
        LEFT(1, "Left"),
        RIGHT(2, "Right");

        private final int value;
        private final String label;

        Side(int value, String label) {
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

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 15)
    private String phone;

    private Short height; // cm

    private Short weight; // kg

    @Enumerated(EnumType.ORDINAL)
    @Column(nullable = false)
    private Side side = Side.BOTH;

    @Column(name = "profile_picture_url", length = 250)
    private String profilePictureUrl;

    @Override
    public String toString() {
        return name != null ? name : id.toString();
    }
}