<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTeamsStore } from '@/stores/teams.js'
import { useLocationsStore } from '@/stores/locations.js'
import { useTrainingsStore } from '@/stores/trainings.js'

// Props
const props = defineProps({
  teamId: {
    type: String,
    default: null
  },
  teamName: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Composables
const teamsStore = useTeamsStore()
const locationsStore = useLocationsStore()
const trainingsStore = useTrainingsStore()

// Reactive state
const teams = ref([])
const locations = ref([])
const isSubmitting = ref(false)
const teamsLoading = ref(false)
const locationsLoading = ref(false)
const submitError = ref('')

// Location creation state
const showCreateLocation = ref(false)
const newLocationName = ref('')
const newLocationLat = ref('')
const newLocationLon = ref('')
const newLocationError = ref('')
const newLocationLatError = ref('')
const newLocationLonError = ref('')
const isCreatingLocation = ref(false)

const formData = reactive({
  teamId: props.teamId || '',
  locationId: '',
  date: '',
  time: '09:00'
})

const errors = reactive({
  teamId: '',
  locationId: '',
  date: '',
  time: ''
})

// Computed
const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const selectedTeamId = computed(() => {
  return props.teamId || formData.teamId
})

const filteredLocations = computed(() => {
  if (!selectedTeamId.value) return []
  return locations.value.filter(location => location.team?.id === selectedTeamId.value)
})

const isLocationFormValid = computed(() => {
  return newLocationName.value.trim() &&
    newLocationLat.value &&
    newLocationLon.value
})

const isFormValid = computed(() => {
  const valid = selectedTeamId.value &&
    formData.locationId &&
    formData.date &&
    formData.time &&
    !Object.values(errors).some(error => error)

  console.log('Form validation debug:', {
    selectedTeamId: selectedTeamId.value,
    locationId: formData.locationId,
    date: formData.date,
    time: formData.time,
    hasErrors: Object.values(errors).some(error => error),
    errors: errors,
    isValid: valid
  })

  return valid
})

// Methods
const validateForm = () => {
  console.log('validateForm called')

  // Reset errors
  Object.keys(errors).forEach(key => errors[key] = '')

  let isValid = true

  if (!selectedTeamId.value) {
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

  console.log('Validation result:', isValid, errors)
  return isValid
}

const loadInitialData = async () => {
  try {
    // Load teams if not pre-selected
    if (!props.teamId) {
      teamsLoading.value = true
      teams.value = await teamsStore.fetchTeams() || []
    }

    // Load locations
    locationsLoading.value = true
    if (selectedTeamId.value) {
      locations.value = await locationsStore.fetchLocationsByTeam(selectedTeamId.value) || []
    } else {
      locations.value = await locationsStore.fetchLocations() || []
    }

    // Set default date to today
    if (!formData.date) {
      formData.date = todayDate.value
    }

    // Auto-select location if only one available
    if (filteredLocations.value.length === 1) {
      formData.locationId = filteredLocations.value[0].id
    }

  } catch (error) {
    console.error('Error loading initial data:', error)
    submitError.value = 'Failed to load teams and locations'
  } finally {
    teamsLoading.value = false
    locationsLoading.value = false
  }
}

const onTeamChange = async () => {
  formData.locationId = ''
  showCreateLocation.value = false
  cancelCreateLocation()

  if (formData.teamId) {
    locationsLoading.value = true
    try {
      const teamLocations = await locationsStore.fetchLocationsByTeam(formData.teamId)
      // Update the filtered locations will be computed automatically

      // Auto-select if only one location
      if (filteredLocations.value.length === 1) {
        formData.locationId = filteredLocations.value[0].id
      }
    } catch (error) {
      console.error('Error loading team locations:', error)
    } finally {
      locationsLoading.value = false
    }
  }
}

const createLocation = async () => {
  console.log('createLocation called')

  // Reset errors
  newLocationError.value = ''
  newLocationLatError.value = ''
  newLocationLonError.value = ''

  let isValid = true

  if (!newLocationName.value.trim()) {
    newLocationError.value = 'Location name is required'
    isValid = false
  }

  if (!newLocationLat.value) {
    newLocationLatError.value = 'Latitude is required'
    isValid = false
  }

  if (!newLocationLon.value) {
    newLocationLonError.value = 'Longitude is required'
    isValid = false
  }

  if (!isValid) {
    console.log('Location form validation failed')
    return
  }

  isCreatingLocation.value = true
  console.log('Creating location...')

  try {
    const locationData = {
      name: newLocationName.value.trim(),
      team: selectedTeamId.value,
      lat: parseFloat(newLocationLat.value),
      lon: parseFloat(newLocationLon.value)
    }

    console.log('Location data to create:', locationData)
    const newLocation = await locationsStore.createLocation(locationData)
    console.log('Location created:', newLocation)

    // Add to local locations list
    locations.value.push(newLocation)

    // Auto-select the new location
    formData.locationId = newLocation.id

    // Reset form
    cancelCreateLocation()

  } catch (error) {
    console.error('Error creating location:', error)
    newLocationError.value = error.message || 'Failed to create location'
  } finally {
    isCreatingLocation.value = false
  }
}

const cancelCreateLocation = () => {
  showCreateLocation.value = false
  newLocationName.value = ''
  newLocationLat.value = ''
  newLocationLon.value = ''
  newLocationError.value = ''
  newLocationLatError.value = ''
  newLocationLonError.value = ''
}

const handleSubmit = async () => {
  console.log('handleSubmit called')
  console.log('Current form state:', formData)
  console.log('isSubmitting before validation:', isSubmitting.value)

  const validationResult = validateForm()
  console.log('Validation result:', validationResult)

  if (!validationResult) {
    console.log('Validation failed - early return')
    return
  }

  if (isSubmitting.value) {
    console.log('Already submitting - early return')
    return
  }

  console.log('Setting isSubmitting to true')
  isSubmitting.value = true
  submitError.value = ''

  try {
    // Combine date and time into start_at datetime
    const startAt = new Date(`${formData.date}T${formData.time}:00`)
    console.log('Start date created:', startAt)

    const trainingData = {
      team: selectedTeamId.value,
      location: formData.locationId,
      start_at: startAt.toISOString()
    }

    console.log('Training data to submit:', trainingData)
    const newTraining = await trainingsStore.createTraining(trainingData)
    console.log('Training created successfully:', newTraining)

    emit('success', newTraining)
    handleClose()

  } catch (error) {
    console.error('Error creating training:', error)
    submitError.value = error.message || 'Failed to create training. Please try again.'
  } finally {
    console.log('Setting isSubmitting to false')
    isSubmitting.value = false
  }
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  if (!isSubmitting.value) {
    handleClose()
  }
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

// Debug watcher for isSubmitting
watch(isSubmitting, (newVal, oldVal) => {
  console.log('isSubmitting changed:', oldVal, '->', newVal)
})

// Lifecycle
onMounted(() => {
  loadInitialData()
})
</script>

<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h3>Create Training Session</h3>
        <button @click="handleClose" class="modal-close" :disabled="isSubmitting">
          ×
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <form @submit.prevent="handleSubmit" class="training-form">
          <!-- Team Selection (if not pre-selected) -->
          <div v-if="!teamId" class="form-group">
            <label for="team-select" class="form-label">
              Team <span class="required">*</span>
            </label>
            <select
              id="team-select"
              v-model="formData.teamId"
              class="form-input"
              :class="{ 'error': errors.teamId }"
              :disabled="isSubmitting || teamsLoading"
              @change="onTeamChange"
            >
              <option value="">Choose a team...</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
            <div v-if="errors.teamId" class="field-error">{{ errors.teamId }}</div>
          </div>

          <!-- Location Selection -->
          <div class="form-group">
            <label for="location-select" class="form-label">
              Location <span class="required">*</span>
            </label>
            <select
              id="location-select"
              v-model="formData.locationId"
              class="form-input"
              :class="{ 'error': errors.locationId }"
              :disabled="isSubmitting || !selectedTeamId || locationsLoading"
            >
              <option value="">
                {{ !selectedTeamId ? 'Select a team first...' : locationsLoading ? 'Loading locations...' : 'Choose a location...' }}
              </option>
              <option v-for="location in filteredLocations" :key="location.id" :value="location.id">
                {{ location.name }}
              </option>
            </select>
            <div v-if="errors.locationId" class="field-error">{{ errors.locationId }}</div>

            <!-- No Locations / Create Location Section -->
            <div v-if="!filteredLocations.length && selectedTeamId && !locationsLoading" class="no-locations-section">
              <div class="field-help">No locations found for this team.</div>
              <button
                type="button"
                @click="showCreateLocation = true"
                class="btn-create-location"
                :disabled="isSubmitting"
              >
                + Create New Location
              </button>
            </div>

            <!-- Quick Location Creation Form -->
            <div v-if="showCreateLocation" class="create-location-form">
              <div class="form-group">
                <label class="form-label">
                  Location Name <span class="required">*</span>
                </label>
                <input
                  v-model="newLocationName"
                  type="text"
                  class="form-input"
                  :class="{ 'error': newLocationError }"
                  placeholder="Enter location name..."
                  :disabled="isCreatingLocation"
                />
                <div v-if="newLocationError" class="field-error">{{ newLocationError }}</div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">
                    Latitude <span class="required">*</span>
                  </label>
                  <input
                    v-model="newLocationLat"
                    type="number"
                    step="any"
                    class="form-input"
                    :class="{ 'error': newLocationLatError }"
                    placeholder="e.g. 40.7128"
                    :disabled="isCreatingLocation"
                  />
                  <div v-if="newLocationLatError" class="field-error">{{ newLocationLatError }}</div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Longitude <span class="required">*</span>
                  </label>
                  <input
                    v-model="newLocationLon"
                    type="number"
                    step="any"
                    class="form-input"
                    :class="{ 'error': newLocationLonError }"
                    placeholder="e.g. -74.0060"
                    :disabled="isCreatingLocation"
                  />
                  <div v-if="newLocationLonError" class="field-error">{{ newLocationLonError }}</div>
                </div>
              </div>

              <div class="location-actions">
                <button
                  type="button"
                  @click="cancelCreateLocation"
                  class="btn-cancel-small"
                  :disabled="isCreatingLocation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  @click="createLocation"
                  class="btn-create-small"
                  :disabled="isCreatingLocation || !isLocationFormValid"
                >
                  <span v-if="isCreatingLocation">Creating...</span>
                  <span v-else>Create</span>
                </button>
              </div>
            </div>
          </div>

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
          </div>

          <!-- Submit Error -->
          <div v-if="submitError" class="error-message">
            <p>{{ submitError }}</p>
          </div>
        </form>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button
          type="button"
          @click="handleClose"
          class="btn-cancel"
          :disabled="isSubmitting"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          class="btn-primary"
          :disabled="isSubmitting || !isFormValid"
        >
          <span v-if="isSubmitting" class="btn-loading">
            <div class="btn-spinner"></div>
            Creating...
          </span>
          <span v-else>Create Training</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
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
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover:not(:disabled) {
  background: #f5f5f5;
  color: #333;
}

.modal-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
}

.training-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.form-input {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
}

.form-input.error {
  border-color: #c33;
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.field-error {
  color: #c33;
  font-size: 0.8rem;
}

.field-help {
  color: #666;
  font-size: 0.8rem;
}

.no-locations-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-create-location {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s ease;
  align-self: flex-start;
}

.btn-create-location:hover:not(:disabled) {
  background: #218838;
}

.btn-create-location:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.create-location-form {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.location-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.btn-cancel-small, .btn-create-small {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel-small {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #ddd;
}

.btn-cancel-small:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-create-small {
  background: #007bff;
  color: white;
}

.btn-create-small:hover:not(:disabled) {
  background: #0056b3;
}

.btn-create-small:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 6px;
  padding: 0.75rem;
  color: #c33;
  font-size: 0.9rem;
}

.error-message p {
  margin: 0;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-cancel, .btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cancel {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #ddd;
}

.btn-cancel:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #ccc;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-content {
    max-width: none;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn-cancel, .btn-primary {
    width: 100%;
  }
}
</style>
