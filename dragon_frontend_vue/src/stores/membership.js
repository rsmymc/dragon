import { defineStore } from 'pinia'
import {
  fetchMembershipsByTeam,
  createMembership,
  updateMembership,
  deleteMembership,
} from '@/services/membership'

export const useMembershipStore = defineStore('membership', {
  state: () => ({
    memberships: [], // All memberships
    teamMemberships: [], // Memberships for current team
    currentMembership: null, // Currently selected membership
    isLoading: false, // Loading state
    error: null, // Error messages

    // Filters and search
    searchQuery: '',
    filters: {
      role: '', // Filter by role: Player, Captain, Coach, Manager
      team: '', // Filter by team
      sortBy: 'name', // Sort by: name, role
    },
  }),

  getters: {
    // Get filtered team memberships
    filteredTeamMemberships: (state) => {
      let filtered = [...state.teamMemberships]

      // Apply search filter (search person name/phone)
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        filtered = filtered.filter(
          (membership) =>
            membership.person.name?.toLowerCase().includes(query) ||
            (membership.person.phone && membership.person.phone.includes(query)),
        )
      }

      // Apply role filter
      if (state.filters.role) {
        console.log(state.filters.role)
        console.log(state.teamMemberships)
        filtered = filtered.filter((membership) => membership.role == state.filters.role)
      }

      // Apply sorting
      return filtered.sort((a, b) => {
        switch (state.filters.sortBy) {
          case 'name':
            return (a.person.name || '').localeCompare(b.person.name || '')
          case 'role':
            return a.role - b.role
          default:
            return 0
        }
      })
    },

    // Get membership by ID
    getMembershipById: (state) => (id) => {
      return state.teamMemberships.find((membership) => membership.id === id)
    },

    // Get memberships by role
    players: (state) => state.teamMemberships.filter((m) => m.role === 1),
    captains: (state) => state.teamMemberships.filter((m) => m.role === 2),
    coaches: (state) => state.teamMemberships.filter((m) => m.role === 3),
    managers: (state) => state.teamMemberships.filter((m) => m.role === 4),

    // Statistics
    teamMembershipsCount: (state) => state.teamMemberships.length,
  },

  actions: {
    // Fetch memberships for a specific team
    async fetchTeamMemberships(teamId) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`Fetching memberships for team ${teamId}...`)
        const memberships = await fetchMembershipsByTeam(teamId)
        this.teamMemberships = memberships
        console.log('Team memberships loaded:', this.teamMemberships.length)
      } catch (error) {
        console.error('Failed to fetch team memberships:', error)
        this.error = 'Failed to load team memberships.'
      } finally {
        this.isLoading = false
      }
    },

    // Create new membership (add person to team)
    async createMembership(membershipData) {
      this.isLoading = true
      this.error = null

      try {
        console.log('Creating membership...', membershipData)
        const newMembership = await createMembership(membershipData)
        this.teamMemberships.push(newMembership)
        console.log('Membership created:', newMembership.person.name)
        return { success: true, membership: newMembership }
      } catch (error) {
        console.error('Failed to create membership:', error)
        this.error = error.response?.data?.message || error.message || 'Failed to create membership'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Update membership
    async updateMembership(membershipId, membershipData) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`Updating membership ${membershipId}...`)
        const updatedMembership = await updateMembership(membershipId, membershipData)

        // Update in team memberships list
        const membershipIndex = this.teamMemberships.findIndex((m) => m.id === membershipId)
        if (membershipIndex !== -1) {
          this.teamMemberships[membershipIndex] = updatedMembership
        }

        console.log('Membership updated')
        return { success: true, membership: updatedMembership }
      } catch (error) {
        console.error('Failed to update membership:', error)
        this.error = error.response?.data?.message || error.message || 'Failed to update membership'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Delete membership (remove person from team)
    async deleteMembership(membershipId) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`Deleting membership ${membershipId}...`)
        await deleteMembership(membershipId)

        const membershipIndex = this.teamMemberships.findIndex((m) => m.id === membershipId)
        if (membershipIndex !== -1) {
          const membershipName = this.teamMemberships[membershipIndex].person.name
          this.teamMemberships.splice(membershipIndex, 1)
          console.log('Membership deleted:', membershipName)
        }

        return { success: true }
      } catch (error) {
        console.error('Failed to delete membership:', error)
        this.error = error.response?.data?.message || error.message || 'Failed to delete membership'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Remove person from team by person ID (convenience method)
    async removePersonFromTeam(teamId, personId) {
      const membership = this.teamMemberships.find((m) => m.person.id === personId)
      if (!membership) {
        return { success: false, error: 'Membership not found' }
      }
      return await this.deleteMembership(membership.id)
    },

    // Set search query
    setSearchQuery(query) {
      this.searchQuery = query || ''
    },

    // Update filters
    updateFilters(newFilters) {
      this.filters = { ...this.filters, ...newFilters }
    },

    // Clear search and filters
    clearFilters() {
      this.searchQuery = ''
      this.filters = {
        role: '',
        team: '',
        sortBy: 'name',
      }
    },

    // Clear error message
    clearError() {
      this.error = null
    },

    // Clear team memberships
    clearTeamMemberships() {
      this.teamMemberships = []
    },

    // Reset store to initial state
    resetStore() {
      this.memberships = []
      this.teamMemberships = []
      this.currentMembership = null
      this.isLoading = false
      this.error = null
      this.searchQuery = ''
      this.filters = {
        role: '',
        team: '',
        sortBy: 'name',
      }
    },
  },
})
