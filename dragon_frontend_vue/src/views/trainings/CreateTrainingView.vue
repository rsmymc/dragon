<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams.js'
import { useLocationsStore } from '@/stores/locations.js'
import { useTrainingsStore } from '@/stores/trainings.js'

const router = useRouter()
const teamsStore = useTeamsStore()
const locationsStore = useLocationsStore()
const trainingsStore = useTrainingsStore()

// Reactive state
const teams = ref([])
const locations = ref([])
const isLoading = ref(false)
const loadingLocations = ref(false)
const isSubmitting = ref(false)
const isCreatingLocation = ref(false)
const loadError = ref('')
const submitError = ref('')
const showCreateLocation = ref(false)

const formData = reactive({
  teamId: '',
  locationId: '',
  date: '',
  time: '09:00',
  duration: 2,
  notes: ''
})

const newLocation = reactive({
  name: '',
  lat: null,
  lon: null
})

const errors = reactive({
  teamId: '',
  locationId: '',
  date: '',
  time: ''
})

// Computed properties
const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const filteredLocations = computed(() => {
  if (!formData.teamId) return []
  return locations.value.filter(location => location.team_id === formData.teamId)
})

const isFormValid = computed(() => {
  return formData.teamId &&
    formData.locationId &&
    formData.date &&
    formData.time &&
    !Object.values(errors).some(error => error)
})

const isNewLocationValid = computed(() => {
  return newLocation.name?.trim() &&
    newLocation.lat !== null &&
    newLocation.lon !== null
})

// Methods
const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '')

  let isValid = true

  if (!formData.teamId) {
    errors.teamId = 'Please select a team'
    isValid = false
  }

  if (!formData.locationId) {
    errors.locationId = 'Please select a location'
    isValid = false
  }

  if (!formData.date) {
    errors.date = 'Please select a date'
    isValid = false
  } else if (formData.date < todayDate.value) {
    errors.date = 'Training date cannot be in the past'
    isValid = false
  }

  if (!formData.time) {
    errors.time = 'Please select a start time'
    isValid = false
  }

  return isValid
}

const loadInitialData = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    // Load teams and all locations
    const [teamsData, locationsData] = await Promise.all([
      teamsStore.fetchTeams(),
      locationsStore.fetchLocations()
    ])

    teams.value = teamsData || []
    locations.value = locationsData || []

    // Set default date to today
    if (!formData.date) {
      formData.date = todayDate.value
    }

    // If only one team, pre-select it
    if (teams.value.length === 1) {
      formData.teamId = teams.value[0].id
    }

  } catch (error) {
    console.error('Error loading initial data:', error)
    loadError.value = error.message || 'Failed to load teams and locations'
  } finally {
    isLoading.value = false
  }
}

const onTeamChange = () => {
  // Reset location when team changes
  formData.locationId = ''

  // Auto-select location if only one available for team
  const teamLocations = filteredLocations.value
  if (teamLocations.length === 1) {
    formData.locationId = teamLocations[0].id
  }
}

const createLocation = async () => {
  if (!isNewLocationValid.value || !formData.teamId) return

  isCreatingLocation.value = true

  try {
    const locationData = {
      team_id: formData.teamId,
      name: newLocation.name.trim(),
      lat: newLocation.lat,
      lon: newLocation.lon
    }

    const createdLocation = await locationsStore.createLocation(locationData)

    // Add to locations list and select it
    locations.value.push(createdLocation)
    formData.locationId = createdLocation.id

    // Reset modal
    newLocation.name = ''
    newLocation.lat = null
    newLocation.lon = null
    showCreateLocation.value = false

  } catch (error) {
    console.error('Error creating location:', error)
    alert(error.message || 'Failed to create location. Please try again.')
  } finally {
    isCreatingLocation.value = false
  }
}

const handleSubmit = async () => {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    // Combine date and time into start_at datetime
    const startAt = new Date(`${formData.date}T${formData.time}:00`)

    const trainingData = {
      team_id: formData.teamId,
      location_id: formData.locationId,
      start_at: startAt.toISOString(),
      notes: formData.notes?.trim() || null
    }

    await trainingsStore.createTraining(trainingData)

    // Navigate to team trainings or back
    const team = teams.value.find(t => t.id === formData.teamId)
    if (team) {
      router.push(`/teams/${team.id}/trainings`)
    } else {
      router.push('/trainings')
    }

  } catch (error) {
    console.error('Error creating training:', error)
    submitError.value = error.message || 'Failed to create training. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/trainings')
  }
}

const handleBack = () => {
  handleCancel()
}

// Watchers
watch(() => formData.teamId, () => {
  if (errors.teamId) validateForm()
})

watch(() => formData.locationId, () => {
  if (errors.locationId) validateForm()
})

watch(() => formData.date, () => {
  if (errors.date) validateForm()
})

watch(() => formData.time, () => {
  if (errors.time) validateForm()
})

// Lifecycle
onMounted(() => {
  loadInitialData()
})

</script>

<template>
  <div class="create-training-view">
    <!-- Header -->
    <div class="header">
      <button @click="handleBack" class="back-btn" :disabled="isSubmitting">
        ← Back
      </button>
      <h1 class="title">Create Training Session</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Loading teams and locations...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="error-container">
      <div class="error-message">
        <h3>Error Loading Data</h3>
        <p>{{ loadError }}</p>
        <button @click="loadInitialData" class="retry-btn">Retry</button>
      </div>
    </div>

    <!-- Training Form -->
    <div v-else class="form-container">
      <form @submit.prevent="handleSubmit" class="training-form">
        <!-- Team Selection -->
        <div class="form-section">
          <h3 class="section-title">Team & Location</h3>

          <!-- Team -->
          <div class="form-group">
            <label for="team-select" class="form-label">
              Team <span class="required">*</span>
            </label>
            <select
              id="team-select"
              v-model="formData.teamId"
              class="form-input"
              :class="{ 'error': errors.teamId }"
              :disabled="isSubmitting"
              @change="onTeamChange"
            >
              <option value="">Choose a team...</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
            <div v-if="errors.teamId" class="field-error">{{ errors.teamId }}</div>
          </div>

          <!-- Location -->
          <div class="form-group">
            <label for="location-select" class="form-label">
              Location <span class="required">*</span>
            </label>
            <select
              id="location-select"
              v-model="formData.locationId"
              class="form-input"
              :class="{ 'error': errors.locationId }"
              :disabled="isSubmitting || !formData.teamId || loadingLocations"
            >
              <option value="">
                {{ !formData.teamId ? 'Select a team first...' : loadingLocations ? 'Loading locations...' : 'Choose a location...' }}
              </option>
              <option v-for="location in filteredLocations" :key="location.id" :value="location.id">
                {{ location.name }}
              </option>
            </select>
            <div v-if="errors.locationId" class="field-error">{{ errors.locationId }}</div>
            <div v-if="!filteredLocations.length && formData.teamId && !loadingLocations" class="field-help">
              No locations found for this team.
              <button type="button" @click="showCreateLocation = true" class="link-btn">
                Create one?
              </button>
            </div>
          </div>
        </div>

        <!-- Training Details -->
        <div class="form-section">
          <h3 class="section-title">Training Details</h3>

          <!-- Date and Time -->
          <div class="form-row">
            <div class="form-group">
              <label for="date" class="form-label">
                Date <span class="required">*</span>
              </label>
              <input
                id="date"
                v-model="formData.date"
                type="date"
                class="form-input"
                :class="{ 'error': errors.date }"
                :min="todayDate"
                :disabled="isSubmitting"
              />
              <div v-if="errors.date" class="field-error">{{ errors.date }}</div>
            </div>

            <div class="form-group">
              <label for="time" class="form-label">
                Start Time <span class="required">*</span>
              </label>
              <input
                id="time"
                v-model="formData.time"
                type="time"
                class="form-input"
                :class="{ 'error': errors.time }"
                :disabled="isSubmitting"
              />
              <div v-if="errors.time" class="field-error">{{ errors.time }}</div>
            </div>

            <div class="form-group">
              <label for="duration" class="form-label">
                Duration (hours)
              </label>
              <select
                id="duration"
                v-model="formData.duration"
                class="form-input"
                :disabled="isSubmitting"
              >
                <option value="1">1 hour</option>
                <option value="1.5">1.5 hours</option>
                <option value="2" selected>2 hours</option>
                <option value="2.5">2.5 hours</option>
                <option value="3">3 hours</option>
              </select>
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label for="notes" class="form-label">Training Notes</label>
            <textarea
              id="notes"
              v-model.trim="formData.notes"
              class="form-textarea"
              placeholder="Training objectives, focus areas, special instructions..."
              rows="4"
              maxlength="500"
              :disabled="isSubmitting"
            ></textarea>
            <div class="field-help">
              {{ formData.notes?.length || 0 }}/500 characters
            </div>
          </div>
        </div>

        <!-- Submit Error -->
        <div v-if="submitError" class="error-message">
          <p>{{ submitError }}</p>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button
            type="button"
            @click="handleCancel"
            class="cancel-btn"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="save-btn"
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="isSubmitting" class="btn-loading">
              <div class="btn-spinner"></div>
              Creating Training...
            </span>
            <span v-else>Create Training</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Create Location Modal -->
    <div v-if="showCreateLocation" class="modal-overlay" @click="showCreateLocation = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Create New Location</h3>
          <button @click="showCreateLocation = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="location-name" class="form-label">
              Location Name <span class="required">*</span>
            </label>
            <input
              id="location-name"
              v-model.trim="newLocation.name"
              type="text"
              class="form-input"
              placeholder="e.g., Marina Bay Training Centre"
              maxlength="255"
              :disabled="isCreatingLocation"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="location-lat" class="form-label">
                Latitude <span class="required">*</span>
              </label>
              <input
                id="location-lat"
                v-model.number="newLocation.lat"
                type="number"
                class="form-input"
                placeholder="e.g., 1.2966"
                step="any"
                :disabled="isCreatingLocation"
              />
            </div>
            <div class="form-group">
              <label for="location-lon" class="form-label">
                Longitude <span class="required">*</span>
              </label>
              <input
                id="location-lon"
                v-model.number="newLocation.lon"
                type="number"
                class="form-input"
                placeholder="e.g., 103.7764"
                step="any"
                :disabled="isCreatingLocation"
              />
            </div>
          </div>
          <div class="field-help">
            You can get coordinates from Google Maps by right-clicking on a location.
          </div>
        </div>
        <div class="modal-actions">
          <button
            type="button"
            @click="showCreateLocation = false"
            class="cancel-btn"
            :disabled="isCreatingLocation"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="createLocation"
            class="save-btn"
            :disabled="isCreatingLocation || !isNewLocationValid"
          >
            <span v-if="isCreatingLocation" class="btn-loading">
              <div class="btn-spinner"></div>
              Creating...
            </span>
            <span v-else>Create Location</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-training-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 4rem);
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.back-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #ccc;
}

.back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.title {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e5e5;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.error-container {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.error-message {
  text-align: center;
  padding: 2rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  margin-bottom: 1rem;
}

.error-message h3 {
  margin: 0 0 0.5rem 0;
  color: #c33;
}

.error-message p {
  margin: 0 0 1rem 0;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #c33;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-btn:hover {
  background: #a22;
}

.form-container {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.training-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
}

.form-label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.required {
  color: #c33;
}

.form-input, .form-textarea {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #007bff;
}

.form-input.error, .form-textarea.error {
  border-color: #c33;
}

.form-input:disabled, .form-textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.field-error {
  color: #c33;
  font-size: 0.8rem;
}

.field-help {
  color: #666;
  font-size: 0.8rem;
}

.link-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.link-btn:hover {
  color: #0056b3;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.cancel-btn, .save-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #ddd;
}

.cancel-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #ccc;
}

.save-btn {
  background: #007bff;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #0056b3;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .create-training-view {
    padding: 1rem;
  }

  .form-container {
    padding: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-actions, .modal-actions {
    flex-direction: column-reverse;
  }

  .cancel-btn, .save-btn {
    width: 100%;
  }

  .modal-content {
    margin: 1rem;
    width: calc(100% - 2rem);
  }
}
</style>
