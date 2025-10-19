package com.dragon.backend.service;

import com.dragon.backend.dto.location.LocationRequestDTO;
import com.dragon.backend.dto.location.LocationResponseDTO;
import com.dragon.backend.model.Location;
import com.dragon.backend.model.Team;
import com.dragon.backend.repository.LocationRepository;
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
public class LocationService {

    private final LocationRepository locationRepository;
    private final TeamRepository teamRepository;
    private final TeamService teamService;

    public List<LocationResponseDTO> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public LocationResponseDTO getLocationById(Integer id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + id));
        return toResponseDTO(location);
    }

    public List<LocationResponseDTO> getLocationsByTeamId(UUID teamId) {
        return locationRepository.findByTeamId(teamId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LocationResponseDTO createLocation(LocationRequestDTO requestDTO) {
        Team team = teamRepository.findById(requestDTO.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + requestDTO.getTeamId()));

        Location location = Location.builder()
                .team(team)
                .lat(requestDTO.getLat())
                .lon(requestDTO.getLon())
                .name(requestDTO.getName())
                .build();

        Location saved = locationRepository.save(location);
        return toResponseDTO(saved);
    }

    @Transactional
    public LocationResponseDTO updateLocation(Integer id, LocationRequestDTO requestDTO) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Location not found with id: " + id));

        Team team = teamRepository.findById(requestDTO.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + requestDTO.getTeamId()));

        location.setTeam(team);
        location.setLat(requestDTO.getLat());
        location.setLon(requestDTO.getLon());
        location.setName(requestDTO.getName());

        Location updated = locationRepository.save(location);
        return toResponseDTO(updated);
    }

    @Transactional
    public void deleteLocation(Integer id) {
        if (!locationRepository.existsById(id)) {
            throw new RuntimeException("Location not found with id: " + id);
        }
        locationRepository.deleteById(id);
    }

    // DTO Conversion
    private LocationResponseDTO toResponseDTO(Location location) {
        return LocationResponseDTO.builder()
                .id(location.getId())
                .team(teamService.getTeamById(location.getTeam().getId()))
                .lat(location.getLat())
                .lon(location.getLon())
                .name(location.getName())
                .createdAt(location.getCreatedAt())
                .updatedAt(location.getUpdatedAt())
                .build();
    }
}