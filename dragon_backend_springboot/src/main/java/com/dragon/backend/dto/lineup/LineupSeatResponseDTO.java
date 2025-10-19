package com.dragon.backend.dto.lineup;

import com.dragon.backend.dto.person.PersonResponseDTO;
import com.dragon.backend.model.LineupSeat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineupSeatResponseDTO {

    private Long id;
    private Long lineupId;
    private PersonResponseDTO person; // Null for empty seats
    private LineupSeat.Side side;
    private Short seatNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}