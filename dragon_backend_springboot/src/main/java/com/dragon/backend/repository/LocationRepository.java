package com.dragon.backend.repository;

import com.dragon.backend.model.Location;
import com.dragon.backend.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, Integer> {

    // Custom query methods:
    List<Location> findByTeam(Team team);
    List<Location> findByTeamId(UUID teamId);
    List<Location> findByNameContainingIgnoreCase(String name);
}