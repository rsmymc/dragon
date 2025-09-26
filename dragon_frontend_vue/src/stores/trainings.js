import { defineStore } from 'pinia'
import trainingsService from '@/services/trainings'

export const useTrainingsStore = defineStore('trainings', {
  state: () => ({
    trainings: [],
    currentTraining: null,
    isLoading: false,
    error: null
  }),

  getters: {
    getTrainingsByTeam: (state) => (teamId) => {
      return state.trainings.filter(training => training.team?.id === teamId)
    },

    getTrainingById: (state) => (id) => {
      return state.trainings.find(training => training.id === id)
    },

    getUpcomingTrainings: (state) => {
      const now = new Date()
      return state.trainings
        .filter(training => new Date(training.start_at) > now)
        .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
    },

    getPastTrainings: (state) => {
      const now = new Date()
      return state.trainings
        .filter(training => new Date(training.start_at) <= now)
        .sort((a, b) => new Date(b.start_at) - new Date(a.start_at)) // Most recent first
    },

    getUpcomingTrainingsByTeam: (state) => (teamId) => {
      const now = new Date()
      return state.trainings
        .filter(training => training.team?.id === teamId && new Date(training.start_at) > now)
        .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
    },

    getPastTrainingsByTeam: (state) => (teamId) => {
      const now = new Date()
      return state.trainings
        .filter(training => training.team?.id === teamId && new Date(training.start_at) <= now)
        .sort((a, b) => new Date(b.start_at) - new Date(a.start_at))
    },

    getTrainingsByDateRange: (state) => (startDate, endDate) => {
      return state.trainings.filter(training => {
        const trainingDate = new Date(training.start_at)
        return trainingDate >= new Date(startDate) && trainingDate <= new Date(endDate)
      })
    },

    getFilteredTrainings: (state) => ({ teamId, timeFilter = 'all', dateRange = null, limit = null }) => {
      let trainings = teamId
        ? state.trainings.filter(training => training.team?.id === teamId)
        : state.trainings

      const now = new Date()

      // Filter by time
      switch (timeFilter) {
        case 'upcoming':
          trainings = trainings.filter(training => new Date(training.start_at) > now)
          break
        case 'past':
          trainings = trainings.filter(training => new Date(training.start_at) <= now)
          break
        // 'all' shows everything
      }

      // Filter by date range
      if (dateRange && (dateRange.start || dateRange.end)) {
        trainings = trainings.filter(training => {
          const trainingDate = new Date(training.start_at)
          const startDate = dateRange.start ? new Date(dateRange.start) : null
          const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null

          if (startDate && trainingDate < startDate) return false
          if (endDate && trainingDate > endDate) return false
          return true
        })
      }

      // Sort: upcoming trainings ascending, past trainings descending
      trainings = trainings.sort((a, b) => {
        const dateA = new Date(a.start_at)
        const dateB = new Date(b.start_at)

        if (timeFilter === 'past') {
          return dateB - dateA // Most recent first for past trainings
        }
        return dateA - dateB // Earliest first for upcoming trainings
      })

      // Apply limit if specified
      if (limit && limit > 0) {
        trainings = trainings.slice(0, limit)
      }

      return trainings
    }
  },

  actions: {
    async fetchTrainings(params = {}) {
      this.isLoading = true
      this.error = null

      try {
        const data = await trainingsService.fetchTrainings(params)
        this.trainings = data.results || data || []
        return this.trainings
      } catch (error) {
        console.error('Error fetching trainings:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchTrainingsByTeam(teamId) {
      this.isLoading = true
      this.error = null

      try {
        const data = await trainingsService.fetchTrainingsByTeam(teamId)
        const teamTrainings = data.results || data || []

        // Update trainings in store (merge with existing)
        teamTrainings.forEach(training => {
          const existingIndex = this.trainings.findIndex(t => t.id === training.id)
          if (existingIndex >= 0) {
            this.trainings[existingIndex] = training
          } else {
            this.trainings.push(training)
          }
        })

        return teamTrainings
      } catch (error) {
        console.error('Error fetching team trainings:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchTraining(id) {
      this.isLoading = true
      this.error = null

      try {
        const training = await trainingsService.fetchTraining(id)
        this.currentTraining = training

        // Update in trainings array if it exists
        const existingIndex = this.trainings.findIndex(t => t.id === training.id)
        if (existingIndex >= 0) {
          this.trainings[existingIndex] = training
        } else {
          this.trainings.push(training)
        }

        return training
      } catch (error) {
        console.error('Error fetching training:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createTraining(trainingData) {
      this.isLoading = true
      this.error = null

      try {
        const newTraining = await trainingsService.createTraining(trainingData)
        this.trainings.unshift(newTraining) // Add to beginning for chronological order
        return newTraining
      } catch (error) {
        console.error('Error creating training:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateTraining(id, trainingData) {
      this.isLoading = true
      this.error = null

      try {
        const updatedTraining = await trainingsService.updateTraining(id, trainingData)

        // Update in trainings array
        const existingIndex = this.trainings.findIndex(t => t.id === id)
        if (existingIndex >= 0) {
          this.trainings[existingIndex] = updatedTraining
        }

        // Update current training if it's the one being updated
        if (this.currentTraining?.id === id) {
          this.currentTraining = updatedTraining
        }

        return updatedTraining
      } catch (error) {
        console.error('Error updating training:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteTraining(id) {
      this.isLoading = true
      this.error = null

      try {
        await trainingsService.deleteTraining(id)

        // Remove from trainings array
        this.trainings = this.trainings.filter(t => t.id !== id)

        // Clear current training if it's the one being deleted
        if (this.currentTraining?.id === id) {
          this.currentTraining = null
        }

        return true
      } catch (error) {
        console.error('Error deleting training:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    },

    clearCurrentTraining() {
      this.currentTraining = null
    }
  }
})
