package com.dragon.backend.dto.lineup;

import com.dragon.backend.model.LineupSeat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineupSeatRequestDTO {

    @NotNull(message = "Lineup ID is required")
    private Long lineupId;

    private UUID personId; // Nullable for empty seats

    @NotNull(message = "Side is required")
    private LineupSeat.Side side;

    @NotNull(message = "Seat number is required")
    @Positive(message = "Seat number must be positive")
    private Short seatNumber;
}