package com.dragon.backend.dto.team;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamRequestDTO {

    @NotBlank(message = "Team name is required")
    private String name;

    private String city;

    @Positive(message = "Max members must be positive")
    private Integer maxMembers = 22;
}