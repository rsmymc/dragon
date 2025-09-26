import api from './api'

const TRAINING_URL = '/training'

/**
 * Get all trainings with filtering, search, and ordering
 * GET /api/v1/trainings/
 */
export async function fetchTrainings(params = {}) {
  try {
    const response = await api.get(`${TRAINING_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error('API Error - fetchTrainings:', error)
    throw error
  }
}

/**
 * Get single training by ID
 * GET /api/v1/trainings/{id}/
 */
export async function fetchTraining(id) {
  try {
    const response = await api.get(`${TRAINING_URL}/${id}/`)
    return response.data
  } catch (error) {
    console.error(`API Error - fetchTraining(${id}):`, error)
    throw error
  }
}

/**
 * Get trainings filtered by team
 * GET /api/v1/trainings/?team={teamId}
 */
export async function fetchTrainingsByTeam(teamId, options = {}) {
  try {
    const params = {
      team: teamId,
      ...options
    }

    const response = await api.get(`${TRAINING_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error(`API Error - fetchTrainingsByTeam(${teamId}):`, error)
    throw error
  }
}

/**
 * Get trainings filtered by location
 * GET /api/v1/trainings/?location={locationId}
 */
export async function fetchTrainingsByLocation(locationId, options = {}) {
  try {
    const params = {
      location: locationId,
      ...options
    }

    const response = await api.get(`${TRAINING_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error(`API Error - fetchTrainingsByLocation(${locationId}):`, error)
    throw error
  }
}

/**
 * Get trainings filtered by date range
 * GET /api/v1/trainings/?start_date={startDate}&end_date={endDate}
 */
export async function fetchTrainingsByDateRange(startDate, endDate, options = {}) {
  try {
    const params = {
      start_date: startDate,
      end_date: endDate,
      ...options
    }

    const response = await api.get(`${TRAINING_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error(`API Error - fetchTrainingsByDateRange(${startDate}, ${endDate}):`, error)
    throw error
  }
}

/**
 * Create new training
 * POST /api/v1/trainings/
 *
 * Expected payload:
 * {
 *   team: number,       // Team ID (ForeignKey)
 *   location: number,   // Location ID (ForeignKey)
 *   start_at: string,   // ISO datetime string
 * }
 */
export async function createTraining(trainingData) {
  try {
    const response = await api.post(`${TRAINING_URL}/`, trainingData)
    return response.data
  } catch (error) {
    console.error('API Error - createTraining:', error)
    throw error
  }
}

/**
 * Update existing training
 * PUT /api/v1/trainings/{id}/
 */
export async function updateTraining(id, trainingData) {
  try {
    const response = await api.put(`${TRAINING_URL}/${id}/`, trainingData)
    return response.data
  } catch (error) {
    console.error(`API Error - updateTraining(${id}):`, error)
    throw error
  }
}

/**
 * Partially update training
 * PATCH /api/v1/trainings/{id}/
 */
export async function patchTraining(id, trainingData) {
  try {
    const response = await api.patch(`${TRAINING_URL}/${id}/`, trainingData)
    return response.data
  } catch (error) {
    console.error(`API Error - patchTraining(${id}):`, error)
    throw error
  }
}

/**
 * Delete training
 * DELETE /api/v1/trainings/{id}/
 */
export async function deleteTraining(id) {
  try {
    await api.delete(`${TRAINING_URL}/${id}/`)
    return true
  } catch (error) {
    console.error(`API Error - deleteTraining(${id}):`, error)
    throw error
  }
}

// Export all functions as default for convenience
export default {
  fetchTrainings,
  fetchTraining,
  fetchTrainingsByTeam,
  fetchTrainingsByLocation,
  fetchTrainingsByDateRange,
  createTraining,
  updateTraining,
  patchTraining,
  deleteTraining
}
