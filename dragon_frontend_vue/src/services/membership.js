import api from './api'

// Base URL for membership endpoints
const MEMBERSHIP_URL = '/membership'

/**
 * Get all memberships with filtering, search, and ordering
 * GET /api/v1/membership/
 */
export async function fetchMemberships(params = {}) {
  try {
    const response = await api.get(`${MEMBERSHIP_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error('API Error - fetchMemberships:', error)
    throw error
  }
}

/**
 * Get single membership by ID
 * GET /api/v1/membership/{id}/
 */
export async function fetchMembership(id) {
  try {
    const response = await api.get(`${MEMBERSHIP_URL}/${id}/`)
    return response.data
  } catch (error) {
    console.error(`API Error - fetchMembership(${id}):`, error)
    throw error
  }
}

/**
 * Get active memberships by team
 * GET /api/v1/membership/?team={teamId}
 */
export async function fetchMembershipsByTeam(teamId, options = {}) {
  try {
    const params = {
      team: teamId,
      ...options,
    }

    const response = await api.get(`${MEMBERSHIP_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error(`API Error - fetchMembershipsByTeam(${teamId}):`, error)
    throw error
  }
}

/**
 * Create new membership
 * POST /api/v1/membership/
 *
 * Expected payload:
 * {
 *   person: number,     // Person ID
 *   team: number,       // Team ID
 *   role: number,       // Role (1=Player, 2=Captain, 3=Coach, 4=Manager)
 * }
 */
export async function createMembership(membershipData) {
  try {
    const response = await api.post(`${MEMBERSHIP_URL}/`, membershipData)
    return response.data
  } catch (error) {
    console.error('API Error - createMembership:', error)
    throw error
  }
}

/**
 * Update existing membership
 * PUT /api/v1/membership/{id}/
 */
export async function updateMembership(id, membershipData) {
  try {
    const response = await api.put(`${MEMBERSHIP_URL}/${id}/`, membershipData)
    return response.data
  } catch (error) {
    console.error(`API Error - updateMembership(${id}):`, error)
    throw error
  }
}

/**
 * Partially update membership
 * PATCH /api/v1/membership/{id}/
 */
export async function patchMembership(id, membershipData) {
  try {
    const response = await api.patch(`${MEMBERSHIP_URL}/${id}/`, membershipData)
    return response.data
  } catch (error) {
    console.error(`API Error - patchMembership(${id}):`, error)
    throw error
  }
}

/**
 * Delete membership
 * DELETE /api/v1/membership/{id}/
 */
export async function deleteMembership(id) {
  try {
    await api.delete(`${MEMBERSHIP_URL}/${id}/`)
    return true
  } catch (error) {
    console.error(`API Error - deleteMembership(${id}):`, error)
    throw error
  }
}

/**
 * Get memberships filtered by person
 * GET /api/v1/membership/?person={personId}
 */
export async function fetchMembershipsByPerson(personId, options = {}) {
  try {
    const params = {
      person: personId,
      ...options,
    }

    const response = await api.get(`${MEMBERSHIP_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error(`API Error - getMembershipsByPerson(${personId}):`, error)
    throw error
  }
}

/**
 * Get memberships filtered by role
 * GET /api/v1/membership/?role={role}
 */
export async function fetchMembershipsByRole(role, options = {}) {
  try {
    const params = {
      role: role,
      ...options,
    }

    const response = await api.get(`${MEMBERSHIP_URL}/`, { params })
    return response.data
  } catch (error) {
    console.error(`API Error - fetchMembershipsByRole(${role}):`, error)
    throw error
  }
}

// Export all functions as default for convenience
export default {
  fetchMemberships,
  fetchMembership,
  fetchMembershipsByTeam,
  createMembership,
  updateMembership,
  patchMembership,
  deleteMembership,
  fetchMembershipsByPerson,
  fetchMembershipsByRole,
}
