package com.dragon.backend.dto.team;

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
public class TeamResponseDTO {

    private UUID id;
    private String name;
    private String city;
    private Integer maxMembers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}