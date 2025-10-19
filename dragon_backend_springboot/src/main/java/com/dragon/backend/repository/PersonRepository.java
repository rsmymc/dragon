package com.dragon.backend.repository;

import com.dragon.backend.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PersonRepository extends JpaRepository<Person, UUID> {

    // Custom query methods:
    Optional<Person> findByPhone(String phone);
    List<Person> findByNameContainingIgnoreCase(String name);
    List<Person> findBySide(Person.Side side);
    boolean existsByPhone(String phone);
}