package com.dragon.backend.controller;

import com.dragon.backend.dto.auth.*;
import com.dragon.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO requestDTO) {
        AuthResponseDTO response = authService.register(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/token")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequestDTO requestDTO) {
        AuthResponseDTO response = authService.login(requestDTO);
        // Return only access and refresh to match Django format
        return ResponseEntity.ok(Map.of(
                "access", response.getAccess(),
                "refresh", response.getRefresh()
        ));
    }

    @PostMapping("/token/refresh")
    public ResponseEntity<TokenRefreshResponseDTO> refreshToken(@Valid @RequestBody TokenRefreshRequestDTO requestDTO) {
        TokenRefreshResponseDTO response = authService.refreshToken(requestDTO);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/token/verify")
    public ResponseEntity<Map<String, Boolean>> verifyToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        boolean isValid = authService.verifyToken(token);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UserResponseDTO response = authService.getCurrentUser(username);
        return ResponseEntity.ok(response);
    }
}