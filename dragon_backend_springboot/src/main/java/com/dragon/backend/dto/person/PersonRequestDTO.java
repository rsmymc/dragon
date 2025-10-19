package com.dragon.backend.dto.person;

import com.dragon.backend.model.Person;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonRequestDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone must be 10-15 digits")
    private String phone;

    @Positive(message = "Height must be positive")
    private Short height; // cm

    @Positive(message = "Weight must be positive")
    private Short weight; // kg

    private Person.Side side = Person.Side.BOTH;

    private String profilePictureUrl;
}