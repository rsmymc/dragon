package com.dragon.backend.dto.membership;

import com.dragon.backend.dto.person.PersonResponseDTO;
import com.dragon.backend.dto.team.TeamResponseDTO;
import com.dragon.backend.model.Membership;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipResponseDTO {

    private UUID id;
    private PersonResponseDTO person;
    private TeamResponseDTO team;
    private Membership.Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}