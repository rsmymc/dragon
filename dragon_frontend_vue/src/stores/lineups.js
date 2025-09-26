import { defineStore } from 'pinia'
import lineupsService from '@/services/lineups'

export const useLineupsStore = defineStore('lineups', {
  state: () => ({
    lineups: [],
    currentLineup: null,
    isLoading: false,
    error: null
  }),

  getters: {
    getLineupById: (state) => (id) => {
      return state.lineups.find(lineup => lineup.id === id)
    },

    getLineupByTraining: (state) => (trainingId) => {
      return state.lineups.find(lineup => lineup.training === trainingId)
    },

    getAssignedSeats: (state) => (lineupId) => {
      const lineup = state.lineups.find(l => l.id === lineupId)
      return lineup?.seats?.filter(seat => seat.person) || []
    },

    getEmptySeats: (state) => (lineupId) => {
      const lineup = state.lineups.find(l => l.id === lineupId)
      return lineup?.seats?.filter(seat => !seat.person) || []
    },

    getSeatsByLineup: (state) => (lineupId) => {
      const lineup = state.lineups.find(l => l.id === lineupId)
      return lineup?.seats || []
    },

    getSeatBySideAndNumber: (state) => (lineupId, side, seatNumber) => {
      const lineup = state.lineups.find(l => l.id === lineupId)
      return lineup?.seats?.find(seat =>
        seat.side === side && seat.seat_number === seatNumber
      ) || null
    }
  },

  actions: {
    async fetchTrainingLineup(trainingId) {
      this.isLoading = true
      this.error = null

      try {
        const lineup = await lineupsService.fetchTrainingLineup(trainingId)
        this.currentLineup = lineup

        // Update in lineups array
        const existingIndex = this.lineups.findIndex(l => l.id === lineup.id)
        if (existingIndex >= 0) {
          this.lineups[existingIndex] = lineup
        } else {
          this.lineups.push(lineup)
        }

        return lineup
      } catch (error) {
        console.error('Error fetching training lineup:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchLineup(id) {
      this.isLoading = true
      this.error = null

      try {
        const lineup = await lineupsService.fetchLineup(id)
        this.currentLineup = lineup

        // Update in lineups array
        const existingIndex = this.lineups.findIndex(l => l.id === lineup.id)
        if (existingIndex >= 0) {
          this.lineups[existingIndex] = lineup
        } else {
          this.lineups.push(lineup)
        }

        return lineup
      } catch (error) {
        console.error('Error fetching lineup:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createLineup(trainingId) {
      this.isLoading = true
      this.error = null

      try {
        const newLineup = await lineupsService.createLineup(trainingId)
        this.lineups.push(newLineup)
        this.currentLineup = newLineup
        return newLineup
      } catch (error) {
        console.error('Error creating lineup:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateLineupState(lineupId, state) {
      this.isLoading = true
      this.error = null

      try {
        const updatedLineup = await lineupsService.updateLineupState(lineupId, state)

        // Update in lineups array
        const existingIndex = this.lineups.findIndex(l => l.id === lineupId)
        if (existingIndex >= 0) {
          this.lineups[existingIndex] = { ...this.lineups[existingIndex], state }
        }

        // Update current lineup if it's the one being updated
        if (this.currentLineup?.id === lineupId) {
          this.currentLineup = { ...this.currentLineup, state }
        }

        return updatedLineup
      } catch (error) {
        console.error('Error updating lineup state:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async assignSeat(lineupId, side, seatNumber, personId) {
      this.isLoading = true
      this.error = null

      try {
        // First, try to find if this seat position already exists
        const lineup = this.lineups.find(l => l.id === lineupId) || this.currentLineup
        const existingSeat = lineup?.seats?.find(s => s.side === side && s.seat_number === seatNumber)

        let seatAssignment

        if (existingSeat) {
          // Update existing seat
          seatAssignment = await lineupsService.updateSeatAssignment(existingSeat.id, personId)
        } else {
          // Create new seat
          seatAssignment = await lineupsService.assignSeat(lineupId, side, seatNumber, personId)
        }

        // Update store state...
        return seatAssignment
      } catch (error) {
        console.error('Error assigning seat:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async removeSeatAssignment(lineupId, side, seatNumber) {
      this.isLoading = true
      this.error = null

      try {
        // Find the seat to remove
        const lineup = this.lineups.find(l => l.id === lineupId)
        const seat = lineup?.seats?.find(
          s => s.side === side && s.seat_number === seatNumber
        )

        if (!seat) {
          throw new Error('Seat not found')
        }

        await lineupsService.removeSeatAssignment(seat.id)

        // Update the lineup seats in store
        if (lineup && lineup.seats) {
          const seatIndex = lineup.seats.findIndex(
            s => s.side === side && s.seat_number === seatNumber
          )
          if (seatIndex >= 0) {
            lineup.seats[seatIndex] = { ...lineup.seats[seatIndex], person: null }
          }
        }

        // Update current lineup if it's the one being modified
        if (this.currentLineup?.id === lineupId && this.currentLineup.seats) {
          const currentSeatIndex = this.currentLineup.seats.findIndex(
            s => s.side === side && s.seat_number === seatNumber
          )
          if (currentSeatIndex >= 0) {
            this.currentLineup.seats[currentSeatIndex] = {
              ...this.currentLineup.seats[currentSeatIndex],
              person: null
            }
          }
        }

        return true
      } catch (error) {
        console.error('Error removing seat assignment:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async clearLineup(lineupId) {
      this.isLoading = true
      this.error = null

      try {
        await lineupsService.clearAllSeats(lineupId)

        // Update the lineup seats in store - remove all person assignments
        const lineup = this.lineups.find(l => l.id === lineupId)
        if (lineup && lineup.seats) {
          lineup.seats = lineup.seats.map(seat => ({ ...seat, person: null }))
        }

        // Update current lineup if it's the one being modified
        if (this.currentLineup?.id === lineupId && this.currentLineup.seats) {
          this.currentLineup.seats = this.currentLineup.seats.map(seat => ({
            ...seat,
            person: null
          }))
        }

        return true
      } catch (error) {
        console.error('Error clearing lineup:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteLineup(id) {
      this.isLoading = true
      this.error = null

      try {
        await lineupsService.deleteLineup(id)

        // Remove from lineups array
        this.lineups = this.lineups.filter(l => l.id !== id)

        // Clear current lineup if it's the one being deleted
        if (this.currentLineup?.id === id) {
          this.currentLineup = null
        }

        return true
      } catch (error) {
        console.error('Error deleting lineup:', error)
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    },

    clearCurrentLineup() {
      this.currentLineup = null
    }
  }
})
