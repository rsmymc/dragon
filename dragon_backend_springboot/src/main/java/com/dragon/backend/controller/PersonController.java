package com.dragon.backend.controller;

import com.dragon.backend.dto.person.PersonRequestDTO;
import com.dragon.backend.dto.person.PersonResponseDTO;
import com.dragon.backend.service.PersonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/persons")
@RequiredArgsConstructor
public class PersonController {

    private final PersonService personService;

    @GetMapping
    public ResponseEntity<List<PersonResponseDTO>> getAllPersons(
            @RequestParam(required = false) String search) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(personService.searchByName(search));
        }
        return ResponseEntity.ok(personService.getAllPersons());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonResponseDTO> getPersonById(@PathVariable UUID id) {
        return ResponseEntity.ok(personService.getPersonById(id));
    }

    @PostMapping
    public ResponseEntity<PersonResponseDTO> createPerson(@Valid @RequestBody PersonRequestDTO requestDTO) {
        PersonResponseDTO created = personService.createPerson(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonResponseDTO> updatePerson(
            @PathVariable UUID id,
            @Valid @RequestBody PersonRequestDTO requestDTO) {
        return ResponseEntity.ok(personService.updatePerson(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePerson(@PathVariable UUID id) {
        personService.deletePerson(id);
        return ResponseEntity.noContent().build();
    }
}