package com.dragon.backend.repository;

import com.dragon.backend.model.Membership;
import com.dragon.backend.model.Person;
import com.dragon.backend.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    // Custom query methods:
    List<Membership> findByTeam(Team team);
    List<Membership> findByTeamId(UUID teamId);
    List<Membership> findByPerson(Person person);
    List<Membership> findByPersonId(UUID personId);
    List<Membership> findByRole(Membership.Role role);
    Optional<Membership> findByPersonAndTeam(Person person, Team team);
    boolean existsByPersonIdAndTeamId(UUID personId, UUID teamId);
}