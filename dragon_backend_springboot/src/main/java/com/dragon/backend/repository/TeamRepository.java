package com.dragon.backend.repository;

import com.dragon.backend.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {

    Optional<Team> findByName(String name);
    boolean existsByName(String name);
}