package com.dragon.backend.service;

import com.dragon.backend.dto.lineup.LineupSeatRequestDTO;
import com.dragon.backend.dto.lineup.LineupSeatResponseDTO;
import com.dragon.backend.model.Lineup;
import com.dragon.backend.model.LineupSeat;
import com.dragon.backend.model.Person;
import com.dragon.backend.repository.LineupRepository;
import com.dragon.backend.repository.LineupSeatRepository;
import com.dragon.backend.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LineupSeatService {

    private final LineupSeatRepository lineupSeatRepository;
    private final LineupRepository lineupRepository;
    private final PersonRepository personRepository;
    private final PersonService personService;

    public List<LineupSeatResponseDTO> getAllLineupSeats() {
        return lineupSeatRepository.findAll().stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public LineupSeatResponseDTO getLineupSeatById(Long id) {
        LineupSeat seat = lineupSeatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LineupSeat not found with id: " + id));
        return toResponseDTO(seat);
    }

    public List<LineupSeatResponseDTO> getLineupSeatsByLineupId(Long lineupId) {
        return lineupSeatRepository.findByLineupId(lineupId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<LineupSeatResponseDTO> getLineupSeatsByLineupIdAndSide(Long lineupId, LineupSeat.Side side) {
        return lineupSeatRepository.findByLineupIdAndSide(lineupId, side).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LineupSeatResponseDTO createLineupSeat(LineupSeatRequestDTO requestDTO) {
        Lineup lineup = lineupRepository.findById(requestDTO.getLineupId())
                .orElseThrow(() -> new RuntimeException("Lineup not found with id: " + requestDTO.getLineupId()));

        // Check if seat is already occupied
        if (lineupSeatRepository.findByLineupIdAndSideAndSeatNumber(
                requestDTO.getLineupId(), requestDTO.getSide(), requestDTO.getSeatNumber()).isPresent()) {
            throw new RuntimeException("Seat already exists at " + requestDTO.getSide() + requestDTO.getSeatNumber());
        }

        Person person = null;
        if (requestDTO.getPersonId() != null) {
            person = personRepository.findById(requestDTO.getPersonId())
                    .orElseThrow(() -> new RuntimeException("Person not found with id: " + requestDTO.getPersonId()));

            // Check if person is already in this lineup
            if (lineupSeatRepository.existsByLineupIdAndPersonId(requestDTO.getLineupId(), requestDTO.getPersonId())) {
                throw new RuntimeException("Person is already assigned to a seat in this lineup");
            }
        }

        LineupSeat seat = LineupSeat.builder()
                .lineup(lineup)
                .person(person)
                .side(requestDTO.getSide())
                .seatNumber(requestDTO.getSeatNumber())
                .build();

        LineupSeat saved = lineupSeatRepository.save(seat);
        return toResponseDTO(saved);
    }

    @Transactional
    public LineupSeatResponseDTO updateLineupSeat(Long id, LineupSeatRequestDTO requestDTO) {
        LineupSeat seat = lineupSeatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("LineupSeat not found with id: " + id));

        Lineup lineup = lineupRepository.findById(requestDTO.getLineupId())
                .orElseThrow(() -> new RuntimeException("Lineup not found with id: " + requestDTO.getLineupId()));

        Person person = null;
        if (requestDTO.getPersonId() != null) {
            person = personRepository.findById(requestDTO.getPersonId())
                    .orElseThrow(() -> new RuntimeException("Person not found with id: " + requestDTO.getPersonId()));
        }

        seat.setLineup(lineup);
        seat.setPerson(person);
        seat.setSide(requestDTO.getSide());
        seat.setSeatNumber(requestDTO.getSeatNumber());

        LineupSeat updated = lineupSeatRepository.save(seat);
        return toResponseDTO(updated);
    }

    @Transactional
    public void deleteLineupSeat(Long id) {
        if (!lineupSeatRepository.existsById(id)) {
            throw new RuntimeException("LineupSeat not found with id: " + id);
        }
        lineupSeatRepository.deleteById(id);
    }

    // DTO Conversion
    private LineupSeatResponseDTO toResponseDTO(LineupSeat seat) {
        return LineupSeatResponseDTO.builder()
                .id(seat.getId())
                .lineupId(seat.getLineup().getId())
                .person(seat.getPerson() != null ? personService.getPersonById(seat.getPerson().getId()) : null)
                .side(seat.getSide())
                .seatNumber(seat.getSeatNumber())
                .createdAt(seat.getCreatedAt())
                .updatedAt(seat.getUpdatedAt())
                .build();
    }
}