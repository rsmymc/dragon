package com.dragon.backend.service;

import com.dragon.backend.dto.team.TeamRequestDTO;
import com.dragon.backend.dto.team.TeamResponseDTO;
import com.dragon.backend.model.Team;
import com.dragon.backend.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;

    public List<TeamResponseDTO> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public TeamResponseDTO getTeamById(UUID id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));
        return toResponseDTO(team);
    }

    @Transactional
    public TeamResponseDTO createTeam(TeamRequestDTO requestDTO) {
        if (teamRepository.existsByName(requestDTO.getName())) {
            throw new RuntimeException("Team with name '" + requestDTO.getName() + "' already exists");
        }

        Team team = Team.builder()
                .name(requestDTO.getName())
                .city(requestDTO.getCity())
                .maxMembers(requestDTO.getMaxMembers())
                .build();

        Team saved = teamRepository.save(team);
        return toResponseDTO(saved);
    }

    @Transactional
    public TeamResponseDTO updateTeam(UUID id, TeamRequestDTO requestDTO) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));

        team.setName(requestDTO.getName());
        team.setCity(requestDTO.getCity());
        team.setMaxMembers(requestDTO.getMaxMembers());

        Team updated = teamRepository.save(team);
        return toResponseDTO(updated);
    }

    @Transactional
    public void deleteTeam(UUID id) {
        if (!teamRepository.existsById(id)) {
            throw new RuntimeException("Team not found with id: " + id);
        }
        teamRepository.deleteById(id);
    }

    // DTO Conversion
    private TeamResponseDTO toResponseDTO(Team team) {
        return TeamResponseDTO.builder()
                .id(team.getId())
                .name(team.getName())
                .city(team.getCity())
                .maxMembers(team.getMaxMembers())
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .build();
    }
}