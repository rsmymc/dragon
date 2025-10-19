package com.dragon.backend.dto.lineup;

import com.dragon.backend.model.Lineup;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineupRequestDTO {

    @NotNull(message = "Training ID is required")
    private Short trainingId;

    @NotNull(message = "State is required")
    private Lineup.State state = Lineup.State.DRAFT;
}