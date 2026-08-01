import { defineStore } from 'pinia'
import attendanceService from '@/services/attendance'

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    roster: [], // merged roster for the currently-open training (detail page only)
    trainingId: null, // which training the roster belongs to
    myStatusByTraining: {},
    isLoading: false,
    isSaving: false,
    error: null,
  }),

  getters: {
    recordedRows: (state) => state.roster.filter((r) => r.attended !== null),
    unrecordedRows: (state) => state.roster.filter((r) => r.attended === null),
    presentCount: (state) => state.roster.filter((r) => r.attended === true).length,
    absentCount: (state) => state.roster.filter((r) => r.attended === false).length,
    myRow: (state) => (membershipId) =>
      state.roster.find((r) => r.membership === membershipId) || null,
  },

  actions: {
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

    // Lightweight: just my own status for one training. Safe to call for
    // many trainings at once (e.g. a trainings list) since it never touches
    // `roster`/`trainingId`.
    async fetchMyStatus(trainingId) {
      try {
        const result = await attendanceService.getMyAttendance(trainingId)
        this.myStatusByTraining[trainingId] = result.attended
        return result.attended
      } catch (error) {
        console.error('Error fetching my attendance status:', error)
        throw error
      }
    },

    async saveMarks(trainingId, marks) {
      this.isSaving = true
      this.error = null

      try {
        console.log(`Saving ${marks.length} marks for training ${trainingId}...`)
        const result = await attendanceService.markAttendance(trainingId, marks)
        console.log('Marks saved:', result.updated, 'skipped:', result.skipped)
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

    async markMine(trainingId, attended) {
      this.isSaving = true
      this.error = null

      try {
        console.log(`Marking my attendance (${attended}) for training ${trainingId}...`)
        const result = await attendanceService.markMyAttendance(trainingId, attended)

        const idx = this.roster.findIndex((r) => r.membership === result.membership)
        if (idx >= 0) {
          this.roster[idx] = { ...this.roster[idx], attended: result.attended }
        }

        // Keep the list-view cache in sync too, regardless of which UI called this.
        this.myStatusByTraining[trainingId] = result.attended

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
