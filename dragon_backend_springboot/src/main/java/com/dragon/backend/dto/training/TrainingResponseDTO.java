package com.dragon.backend.dto.training;

import com.dragon.backend.dto.location.LocationResponseDTO;
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
public class TrainingResponseDTO {

    private Short id;
    private TeamResponseDTO team;
    private LocationResponseDTO location;
    private LocalDateTime startAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}