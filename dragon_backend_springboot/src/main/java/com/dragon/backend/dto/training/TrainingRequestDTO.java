package com.dragon.backend.dto.training;

import jakarta.validation.constraints.NotNull;
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
public class TrainingRequestDTO {

    @NotNull(message = "Team ID is required")
    private UUID teamId;

    @NotNull(message = "Location ID is required")
    private Integer locationId;

    @NotNull(message = "Start time is required")
    private LocalDateTime startAt;
}