package com.dragon.backend.service;

import com.dragon.backend.dto.membership.MembershipRequestDTO;
import com.dragon.backend.dto.membership.MembershipResponseDTO;
import com.dragon.backend.model.Membership;
import com.dragon.backend.model.Person;
import com.dragon.backend.model.Team;
import com.dragon.backend.repository.MembershipRepository;
import com.dragon.backend.repository.PersonRepository;
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
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final PersonRepository personRepository;
    private final TeamRepository teamRepository;
    private final PersonService personService;
    private final TeamService teamService;

    public List<MembershipResponseDTO> getAllMemberships() {
        return membershipRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public MembershipResponseDTO getMembershipById(UUID id) {
        Membership membership = membershipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membership not found with id: " + id));
        return toResponseDTO(membership);
    }

    public List<MembershipResponseDTO> getMembershipsByTeamId(UUID teamId) {
        return membershipRepository.findByTeamId(teamId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<MembershipResponseDTO> getMembershipsByPersonId(UUID personId) {
        return membershipRepository.findByPersonId(personId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MembershipResponseDTO createMembership(MembershipRequestDTO requestDTO) {
        if (membershipRepository.existsByPersonIdAndTeamId(requestDTO.getPersonId(), requestDTO.getTeamId())) {
            throw new RuntimeException("Membership already exists for this person and team");
        }

        Person person = personRepository.findById(requestDTO.getPersonId())
                .orElseThrow(() -> new RuntimeException("Person not found with id: " + requestDTO.getPersonId()));

        Team team = teamRepository.findById(requestDTO.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + requestDTO.getTeamId()));

        Membership membership = Membership.builder()
                .person(person)
                .team(team)
                .role(requestDTO.getRole())
                .build();

        Membership saved = membershipRepository.save(membership);
        return toResponseDTO(saved);
    }

    @Transactional
    public MembershipResponseDTO updateMembership(UUID id, MembershipRequestDTO requestDTO) {
        Membership membership = membershipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membership not found with id: " + id));

        Person person = personRepository.findById(requestDTO.getPersonId())
                .orElseThrow(() -> new RuntimeException("Person not found with id: " + requestDTO.getPersonId()));

        Team team = teamRepository.findById(requestDTO.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + requestDTO.getTeamId()));

        membership.setPerson(person);
        membership.setTeam(team);
        membership.setRole(requestDTO.getRole());

        Membership updated = membershipRepository.save(membership);
        return toResponseDTO(updated);
    }

    @Transactional
    public void deleteMembership(UUID id) {
        if (!membershipRepository.existsById(id)) {
            throw new RuntimeException("Membership not found with id: " + id);
        }
        membershipRepository.deleteById(id);
    }

    // DTO Conversion
    private MembershipResponseDTO toResponseDTO(Membership membership) {
        return MembershipResponseDTO.builder()
                .id(membership.getId())
                .person(personService.getPersonById(membership.getPerson().getId()))
                .team(teamService.getTeamById(membership.getTeam().getId()))
                .role(membership.getRole())
                .createdAt(membership.getCreatedAt())
                .updatedAt(membership.getUpdatedAt())
                .build();
    }
}