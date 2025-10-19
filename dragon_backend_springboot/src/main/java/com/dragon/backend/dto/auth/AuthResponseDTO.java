package com.dragon.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDTO {

    private String access;  // Changed from 'token' to match Django
    private String refresh;
    private String type = "Bearer";
    private UUID userId;
    private String username;
    private String email;
}