package com.dragon.backend.controller;

import com.dragon.backend.dto.location.LocationRequestDTO;
import com.dragon.backend.dto.location.LocationResponseDTO;
import com.dragon.backend.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<List<LocationResponseDTO>> getAllLocations(
            @RequestParam(required = false) UUID teamId) {
        if (teamId != null) {
            return ResponseEntity.ok(locationService.getLocationsByTeamId(teamId));
        }
        return ResponseEntity.ok(locationService.getAllLocations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationResponseDTO> getLocationById(@PathVariable Integer id) {
        return ResponseEntity.ok(locationService.getLocationById(id));
    }

    @PostMapping
    public ResponseEntity<LocationResponseDTO> createLocation(@Valid @RequestBody LocationRequestDTO requestDTO) {
        LocationResponseDTO created = locationService.createLocation(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocationResponseDTO> updateLocation(
            @PathVariable Integer id,
            @Valid @RequestBody LocationRequestDTO requestDTO) {
        return ResponseEntity.ok(locationService.updateLocation(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable Integer id) {
        locationService.deleteLocation(id);
        return ResponseEntity.noContent().build();
    }
}