package com.dragon.backend.repository;

import com.dragon.backend.model.Lineup;
import com.dragon.backend.model.LineupSeat;
import com.dragon.backend.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LineupSeatRepository extends JpaRepository<LineupSeat, Long> {

    // Custom query methods:
    List<LineupSeat> findByLineup(Lineup lineup);
    List<LineupSeat> findByLineupId(Long lineupId);
    List<LineupSeat> findByLineupIdAndSide(Long lineupId, LineupSeat.Side side);
    List<LineupSeat> findByPerson(Person person);
    List<LineupSeat> findByPersonId(UUID personId);
    Optional<LineupSeat> findByLineupIdAndSideAndSeatNumber(Long lineupId, LineupSeat.Side side, Short seatNumber);
    boolean existsByLineupIdAndPersonId(Long lineupId, UUID personId);
}