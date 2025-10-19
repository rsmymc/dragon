package com.dragon.backend.controller;

import com.dragon.backend.dto.lineup.LineupRequestDTO;
import com.dragon.backend.dto.lineup.LineupResponseDTO;
import com.dragon.backend.model.Lineup;
import com.dragon.backend.service.LineupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lineups")
@RequiredArgsConstructor
public class LineupController {

    private final LineupService lineupService;

    @GetMapping
    public ResponseEntity<List<LineupResponseDTO>> getAllLineups(
            @RequestParam(required = false) Lineup.State state,
            @RequestParam(required = false) Short trainingId) {
        if (state != null) {
            return ResponseEntity.ok(lineupService.getLineupsByState(state));
        }
        if (trainingId != null) {
            return ResponseEntity.ok(List.of(lineupService.getLineupByTrainingId(trainingId)));
        }
        return ResponseEntity.ok(lineupService.getAllLineups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LineupResponseDTO> getLineupById(@PathVariable Long id) {
        return ResponseEntity.ok(lineupService.getLineupById(id));
    }

    @PostMapping
    public ResponseEntity<LineupResponseDTO> createLineup(@Valid @RequestBody LineupRequestDTO requestDTO) {
        LineupResponseDTO created = lineupService.createLineup(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LineupResponseDTO> updateLineup(
            @PathVariable Long id,
            @Valid @RequestBody LineupRequestDTO requestDTO) {
        return ResponseEntity.ok(lineupService.updateLineup(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLineup(@PathVariable Long id) {
        lineupService.deleteLineup(id);
        return ResponseEntity.noContent().build();
    }
}