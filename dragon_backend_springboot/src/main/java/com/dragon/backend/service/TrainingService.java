package com.dragon.backend.service;

import com.dragon.backend.dto.training.TrainingRequestDTO;
import com.dragon.backend.dto.training.TrainingResponseDTO;
import com.dragon.backend.model.Location;
import com.dragon.backend.model.Team;
import com.dragon.backend.model.Training;
import com.dragon.backend.repository.LocationRepository;
import com.dragon.backend.repository.TeamRepository;
import com.dragon.backend.repository.TrainingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TeamRepository teamRepository;
    private final LocationRepository locationRepository;
    private final TeamService teamService;
    private final LocationService locationService;

    public List<TrainingResponseDTO> getAllTrainings() {
        return trainingRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public TrainingResponseDTO getTrainingById(Short id) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Training not found with id: " + id));
        return toResponseDTO(training);
    }

    public List<TrainingResponseDTO> getTrainingsByTeamId(UUID teamId) {
        return trainingRepository.findByTeamId(teamId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TrainingResponseDTO createTraining(TrainingRequestDTO requestDTO) {
        Team team = teamRepository.findById(requestDTO.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + requestDTO.getTeamId()));

        Location location = locationRepository.findById(requestDTO.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + requestDTO.getLocationId()));

        Training training = Training.builder()
                .team(team)
                .location(location)
                .startAt(requestDTO.getStartAt())
                .build();

        Training saved = trainingRepository.save(training);
        return toResponseDTO(saved);
    }

    @Transactional
    public TrainingResponseDTO updateTraining(Short id, TrainingRequestDTO requestDTO) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Training not found with id: " + id));

        Team team = teamRepository.findById(requestDTO.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + requestDTO.getTeamId()));

        Location location = locationRepository.findById(requestDTO.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + requestDTO.getLocationId()));

        training.setTeam(team);
        training.setLocation(location);
        training.setStartAt(requestDTO.getStartAt());

        Training updated = trainingRepository.save(training);
        return toResponseDTO(updated);
    }

    @Transactional
    public void deleteTraining(Short id) {
        if (!trainingRepository.existsById(id)) {
            throw new RuntimeException("Training not found with id: " + id);
        }
        trainingRepository.deleteById(id);
    }

    // DTO Conversion
    private TrainingResponseDTO toResponseDTO(Training training) {
        return TrainingResponseDTO.builder()
                .id(training.getId())
                .team(teamService.getTeamById(training.getTeam().getId()))
                .location(locationService.getLocationById(training.getLocation().getId()))
                .startAt(training.getStartAt())
                .createdAt(training.getCreatedAt())
                .updatedAt(training.getUpdatedAt())
                .build();
    }
}