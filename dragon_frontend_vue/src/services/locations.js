import api from './api'

const LOCATION_URL = '/location'

/**
 * Get all locations with filtering, search, and ordering
 * GET /api/v1/locations/
 */
export async function fetchLocations(params = {}) {
  try {
    const response = await api.get(`${LOCATION_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error('API Error - fetchLocations:', error)
    throw error
  }
}

/**
 * Get single location by ID
 * GET /api/v1/locations/{id}/
 */
export async function fetchLocation(id) {
  try {
    const response = await api.get(`${LOCATION_URL}/${id}/`)
    return response.data
  } catch (error) {
    console.error(`API Error - fetchLocation(${id}):`, error)
    throw error
  }
}

/**
 * Get locations filtered by team
 * GET /api/v1/locations/?team={teamId}
 */
export async function fetchLocationsByTeam(teamId, options = {}) {
  try {
    const params = {
      team: teamId,
      ...options
    }

    const response = await api.get(`${LOCATION_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error(`API Error - fetchLocationsByTeam(${teamId}):`, error)
    throw error
  }
}

/**
 * Create new location
 * POST /api/v1/locations/
 *
 * Expected payload:
 * {
 *   team: number,       // Team ID
 *   name: string,       // Location name
 *   lat: number,        // Latitude
 *   lon: number,        // Longitude
 * }
 */
export async function createLocation(locationData) {
  try {
    const response = await api.post(`${LOCATION_URL}/`, locationData)
    return response.data
  } catch (error) {
    console.error('API Error - createLocation:', error)
    throw error
  }
}

/**
 * Update existing location
 * PUT /api/v1/locations/{id}/
 */
export async function updateLocation(id, locationData) {
  try {
    const response = await api.put(`${LOCATION_URL}/${id}/`, locationData)
    return response.data
  } catch (error) {
    console.error(`API Error - updateLocation(${id}):`, error)
    throw error
  }
}

/**
 * Partially update location
 * PATCH /api/v1/locations/{id}/
 */
export async function patchLocation(id, locationData) {
  try {
    const response = await api.patch(`${LOCATION_URL}/${id}/`, locationData)
    return response.data
  } catch (error) {
    console.error(`API Error - patchLocation(${id}):`, error)
    throw error
  }
}

/**
 * Delete location
 * DELETE /api/v1/locations/{id}/
 */
export async function deleteLocation(id) {
  try {
    await api.delete(`${LOCATION_URL}/${id}/`)
    return true
  } catch (error) {
    console.error(`API Error - deleteLocation(${id}):`, error)
    throw error
  }
}

// Export all functions as default for convenience
export default {
  fetchLocations,
  fetchLocation,
  fetchLocationsByTeam,
  createLocation,
  updateLocation,
  patchLocation,
  deleteLocation
}
