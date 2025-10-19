package com.dragon.backend.dto.person;

import com.dragon.backend.model.Person;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonResponseDTO {

    private UUID id;
    private String name;
    private String phone;
    private Short height;
    private Short weight;
    private Person.Side side;
    private String profilePictureUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}