package com.dragon.backend.controller;

import com.dragon.backend.dto.lineup.LineupSeatRequestDTO;
import com.dragon.backend.dto.lineup.LineupSeatResponseDTO;
import com.dragon.backend.model.LineupSeat;
import com.dragon.backend.service.LineupSeatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lineup-seats")
@RequiredArgsConstructor
public class LineupSeatController {

    private final LineupSeatService lineupSeatService;

    @GetMapping
    public ResponseEntity<List<LineupSeatResponseDTO>> getAllLineupSeats(
            @RequestParam(required = false) Long lineupId,
            @RequestParam(required = false) LineupSeat.Side side) {
        if (lineupId != null && side != null) {
            return ResponseEntity.ok(lineupSeatService.getLineupSeatsByLineupIdAndSide(lineupId, side));
        }
        if (lineupId != null) {
            return ResponseEntity.ok(lineupSeatService.getLineupSeatsByLineupId(lineupId));
        }
        return ResponseEntity.ok(lineupSeatService.getAllLineupSeats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LineupSeatResponseDTO> getLineupSeatById(@PathVariable Long id) {
        return ResponseEntity.ok(lineupSeatService.getLineupSeatById(id));
    }

    @PostMapping
    public ResponseEntity<LineupSeatResponseDTO> createLineupSeat(@Valid @RequestBody LineupSeatRequestDTO requestDTO) {
        LineupSeatResponseDTO created = lineupSeatService.createLineupSeat(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LineupSeatResponseDTO> updateLineupSeat(
            @PathVariable Long id,
            @Valid @RequestBody LineupSeatRequestDTO requestDTO) {
        return ResponseEntity.ok(lineupSeatService.updateLineupSeat(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLineupSeat(@PathVariable Long id) {
        lineupSeatService.deleteLineupSeat(id);
        return ResponseEntity.noContent().build();
    }
}