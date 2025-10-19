package com.dragon.backend.repository;

import com.dragon.backend.model.Training;
import com.dragon.backend.model.Team;
import com.dragon.backend.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TrainingRepository extends JpaRepository<Training, Short> {

    // Custom query methods:
    List<Training> findByTeam(Team team);
    List<Training> findByTeamId(UUID teamId);
    List<Training> findByLocation(Location location);
    List<Training> findByStartAtBetween(LocalDateTime start, LocalDateTime end);
    List<Training> findByTeamIdAndStartAtBetween(UUID teamId, LocalDateTime start, LocalDateTime end);
    List<Training> findByStartAtAfter(LocalDateTime dateTime);
    List<Training> findByStartAtBefore(LocalDateTime dateTime);
}