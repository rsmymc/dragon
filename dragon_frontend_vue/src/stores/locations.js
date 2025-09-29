import { defineStore } from 'pinia'
import locationsService from '@/services/locations'

export const useLocationsStore = defineStore('locations', {
  state: () => ({
    locations: [],
    currentLocation: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    getLocationsByTeam: (state) => (teamId) => {
      return state.locations.filter((location) => location.team === teamId)
    },

    getLocationById: (state) => (id) => {
      return state.locations.find((location) => location.id === id)
    },
  },

  actions: {
    async fetchLocations(params = {}) {
      this.isLoading = true
      this.error = null

      try {
        const data = await locationsService.fetchLocations(params)
        this.locations = data.results || data || []
        return this.locations
      } catch (error) {
        console.error('Error fetching locations:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchLocationsByTeam(teamId) {
      this.isLoading = true
      this.error = null

      try {
        const data = await locationsService.fetchLocationsByTeam(teamId)
        const teamLocations = data.results || data || []

        // Update locations in store (merge with existing)
        teamLocations.forEach((location) => {
          const existingIndex = this.locations.findIndex((l) => l.id === location.id)
          if (existingIndex >= 0) {
            this.locations[existingIndex] = location
          } else {
            this.locations.push(location)
          }
        })

        return teamLocations
      } catch (error) {
        console.error('Error fetching team locations:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchLocation(id) {
      this.isLoading = true
      this.error = null

      try {
        const location = await locationsService.fetchLocation(id)
        this.currentLocation = location

        // Update in locations array if it exists
        const existingIndex = this.locations.findIndex((l) => l.id === location.id)
        if (existingIndex >= 0) {
          this.locations[existingIndex] = location
        } else {
          this.locations.push(location)
        }

        return location
      } catch (error) {
        console.error('Error fetching location:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createLocation(locationData) {
      this.isLoading = true
      this.error = null

      try {
        const newLocation = await locationsService.createLocation(locationData)
        this.locations.push(newLocation)
        return newLocation
      } catch (error) {
        console.error('Error creating location:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateLocation(id, locationData) {
      this.isLoading = true
      this.error = null

      try {
        const updatedLocation = await locationsService.updateLocation(id, locationData)

        // Update in locations array
        const existingIndex = this.locations.findIndex((l) => l.id === id)
        if (existingIndex >= 0) {
          this.locations[existingIndex] = updatedLocation
        }

        // Update current location if it's the one being updated
        if (this.currentLocation?.id === id) {
          this.currentLocation = updatedLocation
        }

        return updatedLocation
      } catch (error) {
        console.error('Error updating location:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteLocation(id) {
      this.isLoading = true
      this.error = null

      try {
        await locationsService.deleteLocation(id)

        // Remove from locations array
        this.locations = this.locations.filter((l) => l.id !== id)

        // Clear current location if it's the one being deleted
        if (this.currentLocation?.id === id) {
          this.currentLocation = null
        }

        return true
      } catch (error) {
        console.error('Error deleting location:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    },

    clearCurrentLocation() {
      this.currentLocation = null
    },
  },
})
