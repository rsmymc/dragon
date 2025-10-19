import { defineStore } from 'pinia'
import { fetchTeams, fetchTeam, createTeam, updateTeam, deleteTeam } from '@/services/teams'

export const useTeamsStore = defineStore('teams', {
  state: () => ({
    teams: [], // List of all teams
    currentTeam: null, // Currently selected team
    isLoading: false, // Loading state
    error: null, // Error messages

    // Filters and search
    searchQuery: '',
    filters: {
      sortBy: 'name', // Sort by: name, created_date, member_count
    },
  }),

  getters: {
    // Get filtered and sorted teams
    filteredTeams: (state) => {
      let filtered = [...state.teams]

      // Apply search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        filtered = filtered.filter(
          (team) =>
            team.name?.toLowerCase().includes(query) ||
            (team.city && team.city.toLowerCase().includes(query)),
        )
      }

      // Apply sorting
      return filtered.sort((a, b) => {
        switch (state.filters.sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '')
          case 'created_at':
            return new Date(b.created_at || 0) - new Date(a.created_at || 0)
          case 'active_member_count':
            return (b.active_member_count || 0) - (a.active_member_count || 0)
          default:
            return 0
        }
      })
    },

    // Get team by ID
    getTeamById: (state) => (id) => {
      return state.teams.find((team) => team.id === id)
    },

    // Get teams statistics
    teamsCount: (state) => state.teams.length,
    totalMembers: (state) => state.teams.reduce((sum, team) => sum + (team.member_count || 0), 0),

    // Get teams by status
    fullTeams: (state) => state.teams.filter((t) => t.member_count >= (t.max_members || 22)),
    almostFullTeams: (state) =>
      state.teams.filter((t) => {
        const maxMembers = t.max_members || 22
        return t.member_count > maxMembers * 0.8 && t.member_count < maxMembers
      }),
  },

  actions: {
    async fetchTeams() {
      this.isLoading = true
      this.error = null

      try {
        console.log('🔄 Fetching teams from API...')

        const teams = await fetchTeams()
        this.teams = teams

        console.log('✅ Teams loaded:', this.teams.length)
      } catch (error) {
        console.error('❌ Failed to fetch teams:', error)
        this.error = 'Failed to load teams. Please check your connection and try again.'

        if (this.teams.length === 0) {
          this.teams = []
        }
      } finally {
        this.isLoading = false
      }
    },

    async fetchTeam(id) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`🔄 Fetching team ${id}...`)

        const existingTeam = this.getTeamById(id)
        if (existingTeam) {
          this.currentTeam = existingTeam
          this.isLoading = false
          return
        }

        const team = await fetchTeam(id)
        this.currentTeam = team

        if (team) {
          console.log('✅ Team loaded:', team.name)
        } else {
          throw new Error('Team not found')
        }
      } catch (error) {
        console.error('❌ Failed to fetch team:', error)
        this.error = 'Failed to load team details.'
      } finally {
        this.isLoading = false
      }
    },

    async createTeam(teamData) {
      this.isLoading = true
      this.error = null

      try {
        console.log('🔄 Creating team:', teamData.name)

        const newTeam = await createTeam(teamData)
        this.teams.push(newTeam)

        console.log('✅ Team created:', newTeam.name)

        return { success: true, team: newTeam }
      } catch (error) {
        console.error('❌ Failed to create team:', error)
        this.error = error.message || 'Failed to create team'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async updateTeam(id, teamData) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`🔄 Updating team ${id}...`)

        const updatedTeam = await updateTeam(id, teamData)

        const index = this.teams.findIndex((t) => t.id === id)
        if (index === -1) {
          throw new Error('Team not found')
        }

        this.teams[index] = updatedTeam

        // Update current team if it's the same
        if (this.currentTeam?.id === id) {
          this.currentTeam = updatedTeam
        }

        console.log('✅ Team updated:', updatedTeam.name)
        return { success: true, team: updatedTeam }
      } catch (error) {
        console.error('❌ Failed to update team:', error)
        this.error = error.message || 'Failed to update team'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    async deleteTeam(id) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`🔄 Deleting team ${id}...`)

        await deleteTeam(id)

        console.log(`teams ${this.teams}`)

        const teamIndex = this.teams.findIndex((t) => t.id === id)
        if (teamIndex === -1) {
          throw new Error('Team not found')
        }

        const teamName = this.teams[teamIndex].name
        this.teams.splice(teamIndex, 1)

        // Clear current team if it's the deleted one
        if (this.currentTeam?.id === parseInt(id)) {
          this.currentTeam = null
        }

        console.log('✅ Team deleted:', teamName)
        return { success: true }
      } catch (error) {
        console.error('❌ Failed to delete team:', error)
        this.error = error.message || 'Failed to delete team'
        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // Set search query
    setSearchQuery(query) {
      this.searchQuery = query || ''
    },

    // Update filters
    updateFilters(newFilters) {
      console.log('new filters', newFilters)
      this.filters = { ...this.filters, ...newFilters }
    },

    // Clear search and filters
    clearFilters() {
      this.searchQuery = ''
      this.filters = {
        sortBy: 'name',
      }
    },

    // Clear error message
    clearError() {
      this.error = null
    },

    // Reset store to initial state
    resetStore() {
      this.teams = []
      this.currentTeam = null
      this.isLoading = false
      this.error = null
      this.searchQuery = ''
      this.filters = {
        active: true,
        sortBy: 'name',
      }
    },
  },
})
