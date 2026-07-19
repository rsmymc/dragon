import { defineStore } from 'pinia'
import attendanceService from '@/services/attendance'

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    roster: [], // merged roster for the currently-open training
    trainingId: null, // which training the roster belongs to
    isLoading: false,
    isSaving: false,
    error: null,
  }),

  getters: {
    // Rows the coach has actually marked (attended !== null)
    recordedRows: (state) => state.roster.filter((r) => r.attended !== null),

    // Rows not yet recorded (third state)
    unrecordedRows: (state) => state.roster.filter((r) => r.attended === null),

    presentCount: (state) => state.roster.filter((r) => r.attended === true).length,
    absentCount: (state) => state.roster.filter((r) => r.attended === false).length,

    // Current user's own row, looked up by their membership id
    myRow: (state) => (membershipId) =>
      state.roster.find((r) => r.membership === membershipId) || null,
  },

  actions: {
    // Load the roster for one training (refetch on open — no caching)
    async fetchRoster(trainingId) {
      this.isLoading = true
      this.error = null

      try {
        console.log(`Fetching attendance roster for training ${trainingId}...`)
        const roster = await attendanceService.getSessionRoster(trainingId)
        this.roster = roster
        this.trainingId = trainingId
        console.log('Roster loaded:', roster.length)
        return roster
      } catch (error) {
        console.error('Error fetching roster:', error)
        this.error = error.response?.data?.detail || error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Coach/captain/manager: bulk-save marks, then refetch to reflect truth
    async saveMarks(trainingId, marks) {
      this.isSaving = true
      this.error = null

      try {
        console.log(`Saving ${marks.length} marks for training ${trainingId}...`)
        const result = await attendanceService.markAttendance(trainingId, marks)
        console.log('Marks saved:', result.updated, 'skipped:', result.skipped)

        // Refetch so store reflects exactly what the server stored
        await this.fetchRoster(trainingId)
        return { success: true, result }
      } catch (error) {
        console.error('Error saving marks:', error)
        this.error = error.response?.data?.detail || error.message
        return { success: false, error: this.error }
      } finally {
        this.isSaving = false
      }
    },

    // Any member: mark own attendance, then patch the local row
    async markMine(trainingId, attended) {
      this.isSaving = true
      this.error = null

      try {
        console.log(`Marking my attendance (${attended}) for training ${trainingId}...`)
        const result = await attendanceService.markMyAttendance(trainingId, attended)

        // Patch the local roster row for my membership, if present
        const idx = this.roster.findIndex((r) => r.membership === result.membership)
        if (idx >= 0) {
          this.roster[idx] = { ...this.roster[idx], attended: result.attended }
        }

        console.log('My attendance marked:', result.attended)
        return { success: true, result }
      } catch (error) {
        console.error('Error marking my attendance:', error)
        this.error = error.response?.data?.detail || error.message
        return { success: false, error: this.error }
      } finally {
        this.isSaving = false
      }
    },

    clearError() {
      this.error = null
    },

    clearRoster() {
      this.roster = []
      this.trainingId = null
    },
  },
})
