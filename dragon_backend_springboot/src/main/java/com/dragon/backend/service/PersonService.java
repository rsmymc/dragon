package com.dragon.backend.service;

import com.dragon.backend.dto.person.PersonRequestDTO;
import com.dragon.backend.dto.person.PersonResponseDTO;
import com.dragon.backend.model.Person;
import com.dragon.backend.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonService {

    private final PersonRepository personRepository;

    public List<PersonResponseDTO> getAllPersons() {
        return personRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public PersonResponseDTO getPersonById(UUID id) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Person not found with id: " + id));
        return toResponseDTO(person);
    }

    @Transactional
    public PersonResponseDTO createPerson(PersonRequestDTO requestDTO) {
        if (personRepository.existsByPhone(requestDTO.getPhone())) {
            throw new RuntimeException("Person with phone '" + requestDTO.getPhone() + "' already exists");
        }

        Person person = Person.builder()
                .name(requestDTO.getName())
                .phone(requestDTO.getPhone())
                .height(requestDTO.getHeight())
                .weight(requestDTO.getWeight())
                .side(requestDTO.getSide())
                .profilePictureUrl(requestDTO.getProfilePictureUrl())
                .build();

        Person saved = personRepository.save(person);
        return toResponseDTO(saved);
    }

    @Transactional
    public PersonResponseDTO updatePerson(UUID id, PersonRequestDTO requestDTO) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Person not found with id: " + id));

        person.setName(requestDTO.getName());
        person.setPhone(requestDTO.getPhone());
        person.setHeight(requestDTO.getHeight());
        person.setWeight(requestDTO.getWeight());
        person.setSide(requestDTO.getSide());
        person.setProfilePictureUrl(requestDTO.getProfilePictureUrl());

        Person updated = personRepository.save(person);
        return toResponseDTO(updated);
    }

    @Transactional
    public void deletePerson(UUID id) {
        if (!personRepository.existsById(id)) {
            throw new RuntimeException("Person not found with id: " + id);
        }
        personRepository.deleteById(id);
    }

    public List<PersonResponseDTO> searchByName(String name) {
        return personRepository.findByNameContainingIgnoreCase(name).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    // DTO Conversion
    private PersonResponseDTO toResponseDTO(Person person) {
        return PersonResponseDTO.builder()
                .id(person.getId())
                .name(person.getName())
                .phone(person.getPhone())
                .height(person.getHeight())
                .weight(person.getWeight())
                .side(person.getSide())
                .profilePictureUrl(person.getProfilePictureUrl())
                .createdAt(person.getCreatedAt())
                .updatedAt(person.getUpdatedAt())
                .build();
    }
}