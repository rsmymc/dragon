package com.dragon.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {

    private String secret;
    private Long expiration; // Access token expiration (e.g., 15 minutes)
    private Long refreshExpiration; // Refresh token expiration (e.g., 7 days)
}