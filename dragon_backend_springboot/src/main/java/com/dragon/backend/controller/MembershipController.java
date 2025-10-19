package com.dragon.backend.controller;

import com.dragon.backend.dto.membership.MembershipRequestDTO;
import com.dragon.backend.dto.membership.MembershipResponseDTO;
import com.dragon.backend.service.MembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @GetMapping
    public ResponseEntity<List<MembershipResponseDTO>> getAllMemberships(
            @RequestParam(required = false) UUID teamId,
            @RequestParam(required = false) UUID personId) {
        if (teamId != null) {
            return ResponseEntity.ok(membershipService.getMembershipsByTeamId(teamId));
        }
        if (personId != null) {
            return ResponseEntity.ok(membershipService.getMembershipsByPersonId(personId));
        }
        return ResponseEntity.ok(membershipService.getAllMemberships());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MembershipResponseDTO> getMembershipById(@PathVariable UUID id) {
        return ResponseEntity.ok(membershipService.getMembershipById(id));
    }

    @PostMapping
    public ResponseEntity<MembershipResponseDTO> createMembership(@Valid @RequestBody MembershipRequestDTO requestDTO) {
        MembershipResponseDTO created = membershipService.createMembership(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MembershipResponseDTO> updateMembership(
            @PathVariable UUID id,
            @Valid @RequestBody MembershipRequestDTO requestDTO) {
        return ResponseEntity.ok(membershipService.updateMembership(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMembership(@PathVariable UUID id) {
        membershipService.deleteMembership(id);
        return ResponseEntity.noContent().build();
    }
}