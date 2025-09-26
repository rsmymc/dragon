import api from './api'

// Base URL for lineup endpoints
const LINEUP_URL = '/lineup'

/**
 * Get lineup for a specific training
 * GET /api/v1/lineups/?training={trainingId}
 */
export async function fetchTrainingLineup(trainingId) {
  try {
    const response = await api.get(`${LINEUP_URL}/`, {
      params: { training: trainingId }
    })
    const data = response.data
    const lineups = data.results || data || []

    if (lineups.length === 0) {
      const error = new Error('Lineup not found')
      error.status = 404
      throw error
    }

    return lineups[0] // Return first lineup (should only be one per training)
  } catch (error) {
    console.error(`API Error - fetchTrainingLineup(${trainingId}):`, error)
    throw error
  }
}

/**
 * Get single lineup by ID
 * GET /api/v1/lineups/{id}/
 */
export async function fetchLineup(id) {
  try {
    const response = await api.get(`${LINEUP_URL}/${id}/`)
    return response.data
  } catch (error) {
    console.error(`API Error - fetchLineup(${id}):`, error)
    throw error
  }
}

/**
 * Create new lineup for a training
 * POST /api/v1/lineups/
 *
 * Expected payload:
 * {
 *   training: number,     // Training ID
 *   state: number,        // LineupState (1=Draft, 2=Published)
 * }
 */
export async function createLineup(trainingId) {
  try {
    const lineupData = {
      training: trainingId,
      state: 1 // Default to Draft
    }

    const response = await api.post(`${LINEUP_URL}/`, lineupData)
    return response.data
  } catch (error) {
    console.error('API Error - createLineup:', error)
    throw error
  }
}

/**
 * Update lineup state (Draft/Published)
 * PATCH /api/v1/lineups/{id}/
 */
export async function updateLineupState(lineupId, state) {
  try {
    const response = await api.patch(`${LINEUP_URL}/${lineupId}/`, { state })
    return response.data
  } catch (error) {
    console.error(`API Error - updateLineupState(${lineupId}):`, error)
    throw error
  }
}

/**
 * Delete lineup
 * DELETE /api/v1/lineups/{id}/
 */
export async function deleteLineup(id) {
  try {
    await api.delete(`${LINEUP_URL}/${id}/`)
    return true
  } catch (error) {
    console.error(`API Error - deleteLineup(${id}):`, error)
    throw error
  }
}

/**
 * Get all seats for a lineup
 * GET /api/v1/lineup-seats/?lineup={lineupId}
 */
export async function fetchLineupSeats(lineupId) {
  try {
    const response = await api.get('/lineup-seat/', {
      params: { lineup: lineupId }
    })
    return response.data
  } catch (error) {
    console.error(`API Error - fetchLineupSeats(${lineupId}):`, error)
    throw error
  }
}

/**
 * Assign a person to a specific seat
 * POST /api/v1/lineup-seats/
 *
 * Expected payload:
 * {
 *   lineup: number,       // Lineup ID
 *   side: string,         // "L" or "R"
 *   seat_number: number,  // 1-8
 *   person: number,       // Person ID
 * }
 */
export async function assignSeat(lineupId, side, seatNumber, personId) {
  try {
    const seatData = {
      lineup: lineupId,
      side: side,
      seat_number: seatNumber,
      person: personId
    }

    const response = await api.post('/lineup-seat/', seatData)
    return response.data
  } catch (error) {
    console.error('API Error - assignSeat:', error)
    throw error
  }
}

/**
 * Update seat assignment
 * Patch /api/v1/lineup-seats/{id}/
 */
export async function updateSeatAssignment(seatId, personId) {
  try {
    const response = await api.patch(`/lineup-seat/${seatId}/`, { person: personId })
    return response.data
  } catch (error) {
    console.error(`API Error - updateSeatAssignment(${seatId}):`, error)
    throw error
  }
}

/**
 * Remove person from seat (set person to null)
 * PATCH /api/v1/lineup-seats/{seatId}/
 */
export async function removeSeatAssignment(seatId) {
  try {
    const response = await api.patch(`/lineup-seat/${seatId}/`, { person: null })
    return response.data
  } catch (error) {
    console.error(`API Error - removeSeatAssignment(${seatId}):`, error)
    throw error
  }
}

/**
 * Delete seat entirely
 * DELETE /api/v1/lineup-seats/{id}/
 */
export async function deleteSeat(seatId) {
  try {
    await api.delete(`/lineup-seat/${seatId}/`)
    return true
  } catch (error) {
    console.error(`API Error - deleteSeat(${seatId}):`, error)
    throw error
  }
}

/**
 * Clear all seat assignments in a lineup
 * Custom endpoint or batch operation
 */
export async function clearAllSeats(lineupId) {
  try {
    // Option 1: If you have a custom endpoint
    // const response = await api.post(`${LINEUP_URL}/${lineupId}/clear-seats/`)

    // Option 2: Get all seats and clear them individually
    const seatsResponse = await fetchLineupSeats(lineupId)
    const seats = seatsResponse.results || seatsResponse || []

    const clearPromises = seats
      .filter(seat => seat.person) // Only clear occupied seats
      .map(seat => removeSeatAssignment(seat.id))

    await Promise.all(clearPromises)
    return true
  } catch (error) {
    console.error(`API Error - clearAllSeats(${lineupId}):`, error)
    throw error
  }
}

// Export all functions as default for convenience
export default {
  fetchTrainingLineup,
  fetchLineup,
  createLineup,
  updateLineupState,
  deleteLineup,
  fetchLineupSeats,
  assignSeat,
  updateSeatAssignment,
  removeSeatAssignment,
  deleteSeat,
  clearAllSeats
}
