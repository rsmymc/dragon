import api from './api'

const attendanceService = {
  async getSessionRoster(trainingId) {
    const { data } = await api.get(`/training/${trainingId}/roster/`)
    return data
  },

  async markAttendance(trainingId, marks) {
    const { data } = await api.post('/attendance/mark/', {
      training: trainingId,
      marks,
    })
    return data
  },

  async markMyAttendance(trainingId, attended) {
    const { data } = await api.post(`/training/${trainingId}/attendance/me/`, { attended })
    return data
  },
}

export default attendanceService
