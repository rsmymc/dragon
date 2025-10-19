package com.dragon.backend.dto.membership;

import com.dragon.backend.model.Membership;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembershipRequestDTO {

    @NotNull(message = "Person ID is required")
    private UUID personId;

    @NotNull(message = "Team ID is required")
    private UUID teamId;

    @NotNull(message = "Role is required")
    private Membership.Role role = Membership.Role.PLAYER;
}