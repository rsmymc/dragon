package com.dragon.backend.controller;

import com.dragon.backend.dto.training.TrainingRequestDTO;
import com.dragon.backend.dto.training.TrainingResponseDTO;
import com.dragon.backend.service.TrainingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trainings")
@RequiredArgsConstructor
public class TrainingController {

    private final TrainingService trainingService;

    @GetMapping
    public ResponseEntity<List<TrainingResponseDTO>> getAllTrainings(
            @RequestParam(required = false) UUID teamId) {
        if (teamId != null) {
            return ResponseEntity.ok(trainingService.getTrainingsByTeamId(teamId));
        }
        return ResponseEntity.ok(trainingService.getAllTrainings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingResponseDTO> getTrainingById(@PathVariable Short id) {
        return ResponseEntity.ok(trainingService.getTrainingById(id));
    }

    @PostMapping
    public ResponseEntity<TrainingResponseDTO> createTraining(@Valid @RequestBody TrainingRequestDTO requestDTO) {
        TrainingResponseDTO created = trainingService.createTraining(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingResponseDTO> updateTraining(
            @PathVariable Short id,
            @Valid @RequestBody TrainingRequestDTO requestDTO) {
        return ResponseEntity.ok(trainingService.updateTraining(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTraining(@PathVariable Short id) {
        trainingService.deleteTraining(id);
        return ResponseEntity.noContent().build();
    }
}