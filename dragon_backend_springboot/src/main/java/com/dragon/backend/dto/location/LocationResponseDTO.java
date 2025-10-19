package com.dragon.backend.dto.location;

import com.dragon.backend.dto.team.TeamResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationResponseDTO {

    private Integer id;
    private TeamResponseDTO team;
    private Double lat;
    private Double lon;
    private String name;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}