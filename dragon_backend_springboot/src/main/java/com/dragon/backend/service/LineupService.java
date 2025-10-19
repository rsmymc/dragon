package com.dragon.backend.service;

import com.dragon.backend.dto.lineup.LineupRequestDTO;
import com.dragon.backend.dto.lineup.LineupResponseDTO;
import com.dragon.backend.model.Lineup;
import com.dragon.backend.model.Training;
import com.dragon.backend.repository.LineupRepository;
import com.dragon.backend.repository.TrainingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LineupService {

    private final LineupRepository lineupRepository;
    private final TrainingRepository trainingRepository;
    private final TrainingService trainingService;

    public List<LineupResponseDTO> getAllLineups() {
        return lineupRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public LineupResponseDTO getLineupById(Long id) {
        Lineup lineup = lineupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lineup not found with id: " + id));
        return toResponseDTO(lineup);
    }

    public LineupResponseDTO getLineupByTrainingId(Short trainingId) {
        Lineup lineup = lineupRepository.findByTrainingId(trainingId)
                .orElseThrow(() -> new RuntimeException("Lineup not found for training id: " + trainingId));
        return toResponseDTO(lineup);
    }

    public List<LineupResponseDTO> getLineupsByState(Lineup.State state) {
        return lineupRepository.findByState(state).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LineupResponseDTO createLineup(LineupRequestDTO requestDTO) {
        if (lineupRepository.existsByTrainingId(requestDTO.getTrainingId())) {
            throw new RuntimeException("Lineup already exists for training id: " + requestDTO.getTrainingId());
        }

        Training training = trainingRepository.findById(requestDTO.getTrainingId())
                .orElseThrow(() -> new RuntimeException("Training not found with id: " + requestDTO.getTrainingId()));

        Lineup lineup = Lineup.builder()
                .training(training)
                .state(requestDTO.getState())
                .build();

        Lineup saved = lineupRepository.save(lineup);
        return toResponseDTO(saved);
    }

    @Transactional
    public LineupResponseDTO updateLineup(Long id, LineupRequestDTO requestDTO) {
        Lineup lineup = lineupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lineup not found with id: " + id));

        Training training = trainingRepository.findById(requestDTO.getTrainingId())
                .orElseThrow(() -> new RuntimeException("Training not found with id: " + requestDTO.getTrainingId()));

        lineup.setTraining(training);
        lineup.setState(requestDTO.getState());

        Lineup updated = lineupRepository.save(lineup);
        return toResponseDTO(updated);
    }

    @Transactional
    public void deleteLineup(Long id) {
        if (!lineupRepository.existsById(id)) {
            throw new RuntimeException("Lineup not found with id: " + id);
        }
        lineupRepository.deleteById(id);
    }

    // DTO Conversion
    private LineupResponseDTO toResponseDTO(Lineup lineup) {
        return LineupResponseDTO.builder()
                .id(lineup.getId())
                .training(trainingService.getTrainingById(lineup.getTraining().getId()))
                .state(lineup.getState())
                .createdAt(lineup.getCreatedAt())
                .updatedAt(lineup.getUpdatedAt())
                .build();
    }
}