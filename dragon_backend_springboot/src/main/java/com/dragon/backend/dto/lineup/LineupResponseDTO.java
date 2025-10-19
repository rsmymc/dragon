package com.dragon.backend.dto.lineup;

import com.dragon.backend.dto.training.TrainingResponseDTO;
import com.dragon.backend.model.Lineup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineupResponseDTO {

    private Long id;
    private TrainingResponseDTO training;
    private Lineup.State state;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}