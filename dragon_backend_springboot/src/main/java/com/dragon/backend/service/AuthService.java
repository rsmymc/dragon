package com.dragon.backend.service;

import com.dragon.backend.dto.auth.*;
import com.dragon.backend.model.RefreshToken;
import com.dragon.backend.model.User;
import com.dragon.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO requestDTO) {
        if (userRepository.existsByUsername(requestDTO.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(requestDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(requestDTO.getUsername())
                .email(requestDTO.getEmail())
                .password(passwordEncoder.encode(requestDTO.getPassword()))
                .isStaff(false)
                .isSuperuser(false)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        String accessToken = jwtService.generateToken(saved.getUsername());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(saved);

        return AuthResponseDTO.builder()
                .access(accessToken)
                .refresh(refreshToken.getToken())
                .userId(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .build();
    }

    @Transactional
    public AuthResponseDTO login(LoginRequestDTO requestDTO) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        requestDTO.getUsername(),
                        requestDTO.getPassword()
                )
        );

        User user = userRepository.findByUsername(requestDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String accessToken = jwtService.generateToken(user.getUsername());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponseDTO.builder()
                .access(accessToken)
                .refresh(refreshToken.getToken())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public TokenRefreshResponseDTO refreshToken(TokenRefreshRequestDTO requestDTO) {
        RefreshToken refreshToken = refreshTokenService.findByToken(requestDTO.getRefresh());
        refreshToken = refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user.getUsername());

        // Optionally rotate refresh token
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return TokenRefreshResponseDTO.builder()
                .access(newAccessToken)
                .refresh(newRefreshToken.getToken())
                .build();
    }

    public UserResponseDTO getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .isStaff(user.getIsStaff())
                .isSuperuser(user.getIsSuperuser())
                .build();
    }

    public boolean verifyToken(String token) {
        try {
            String username = jwtService.extractUsername(token);
            return username != null && !jwtService.isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}