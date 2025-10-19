package com.dragon.backend.repository;

import com.dragon.backend.model.Lineup;
import com.dragon.backend.model.Training;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LineupRepository extends JpaRepository<Lineup, Long> {

    // Custom query methods:
    Optional<Lineup> findByTraining(Training training);
    Optional<Lineup> findByTrainingId(Short trainingId);
    List<Lineup> findByState(Lineup.State state);
    boolean existsByTrainingId(Short trainingId);
}