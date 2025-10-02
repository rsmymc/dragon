<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTeamsStore } from '@/stores/teams.js'
import { useLocationsStore } from '@/stores/locations.js'
import { useTrainingsStore } from '@/stores/trainings.js'
import styles from '@/assets/styles/create-training.module.css'

// Props
const props = defineProps({
  teamId: {
    type: String,
    default: null,
  },
  teamName: {
    type: String,
    default: '',
  },
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
  time: '09:00',
})

const errors = reactive({
  teamId: '',
  locationId: '',
  date: '',
  time: '',
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
  return locations.value.filter((location) => location.team?.id === selectedTeamId.value)
})

const isLocationFormValid = computed(() => {
  return newLocationName.value.trim() && newLocationLat.value && newLocationLon.value
})

const isFormValid = computed(() => {
  const valid =
    selectedTeamId.value &&
    formData.locationId &&
    formData.date &&
    formData.time &&
    !Object.values(errors).some((error) => error)

  console.log('Form validation debug:', {
    selectedTeamId: selectedTeamId.value,
    locationId: formData.locationId,
    date: formData.date,
    time: formData.time,
    hasErrors: Object.values(errors).some((error) => error),
    errors: errors,
    isValid: valid,
  })

  return valid
})

// Methods
const validateForm = () => {
  console.log('validateForm called')

  // Reset errors
  Object.keys(errors).forEach((key) => (errors[key] = ''))

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
      teams.value = (await teamsStore.fetchTeams()) || []
    }

    // Load locations
    locationsLoading.value = true
    if (selectedTeamId.value) {
      locations.value = (await locationsStore.fetchLocationsByTeam(selectedTeamId.value)) || []
    } else {
      locations.value = (await locationsStore.fetchLocations()) || []
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
      lon: parseFloat(newLocationLon.value),
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
      start_at: startAt.toISOString(),
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
watch(
  () => formData.teamId,
  () => {
    if (errors.teamId) validateForm()
  },
)

watch(
  () => formData.locationId,
  () => {
    if (errors.locationId) validateForm()
  },
)

watch(
  () => formData.date,
  () => {
    if (errors.date) validateForm()
  },
)

watch(
  () => formData.time,
  () => {
    if (errors.time) validateForm()
  },
)

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
  <div :class="styles.modalOverlay" @click="handleOverlayClick">
    <div :class="styles.modalContent" @click.stop>
      <!-- Modal Header -->
      <div :class="styles.modalHeader">
        <h3>Create Training Session</h3>
        <button @click="handleClose" :class="styles.modalClose" :disabled="isSubmitting">×</button>
      </div>

      <!-- Modal Body -->
      <div :class="styles.modalBody">
        <form @submit.prevent="handleSubmit" :class="styles.trainingForm">
          <!-- Team Selection (if not pre-selected) -->
          <div v-if="!teamId" :class="styles.formGroup">
            <label for="team-select" :class="styles.formLabel">
              Team <span :class="styles.required">*</span>
            </label>
            <select
              id="team-select"
              v-model="formData.teamId"
              :class="[styles.formInput, { error: errors.teamId }]"
              :disabled="isSubmitting || teamsLoading"
              @change="onTeamChange"
            >
              <option value="">Choose a team...</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
            <div v-if="errors.teamId" :class="styles.fieldError">{{ errors.teamId }}</div>
          </div>

          <!-- Location Selection -->
          <div :class="styles.formGroup">
            <label for="location-select" :class="styles.formLabel">
              Location <span :class="styles.required">*</span>
            </label>
            <select
              id="location-select"
              v-model="formData.locationId"
              :class="[styles.formInput, { error: errors.locationId }]"
              :disabled="isSubmitting || !selectedTeamId || locationsLoading"
            >
              <option value="">
                {{
                  !selectedTeamId
                    ? 'Select a team first...'
                    : locationsLoading
                      ? 'Loading locations...'
                      : 'Choose a location...'
                }}
              </option>
              <option v-for="location in filteredLocations" :key="location.id" :value="location.id">
                {{ location.name }}
              </option>
            </select>
            <div v-if="errors.locationId" :class="styles.fieldError">{{ errors.locationId }}</div>

            <!-- No Locations / Create Location Section -->
            <div
              v-if="!filteredLocations.length && selectedTeamId && !locationsLoading"
              :class="styles.noLocationsSection"
            >
              <div :class="styles.fieldHelp">No locations found for this team.</div>
              <button
                type="button"
                @click="showCreateLocation = true"
                :class="styles.btnCreateLocation"
                :disabled="isSubmitting"
              >
                + Create New Location
              </button>
            </div>

            <!-- Quick Location Creation Form -->
            <div v-if="showCreateLocation" :class="styles.createLocationForm">
              <div :class="styles.formGroup">
                <label :class="styles.formLabel">
                  Location Name <span :class="styles.required">*</span>
                </label>
                <input
                  v-model="newLocationName"
                  type="text"
                  :class="[styles.formInput, { error: newLocationError }]"
                  placeholder="Enter location name..."
                  :disabled="isCreatingLocation"
                />
                <div v-if="newLocationError" :class="styles.fieldError">{{ newLocationError }}</div>
              </div>

              <div :class="styles.formRow">
                <div :class="styles.formGroup">
                  <label :class="styles.formLabel">
                    Latitude <span :class="styles.required">*</span>
                  </label>
                  <input
                    v-model="newLocationLat"
                    type="number"
                    step="any"
                    :class="[styles.formInput, { error: newLocationLatError }]"
                    placeholder="e.g. 40.7128"
                    :disabled="isCreatingLocation"
                  />
                  <div v-if="newLocationLatError" :class="styles.fieldError">
                    {{ newLocationLatError }}
                  </div>
                </div>

                <div :class="styles.formGroup">
                  <label :class="styles.formLabel">
                    Longitude <span :class="styles.required">*</span>
                  </label>
                  <input
                    v-model="newLocationLon"
                    type="number"
                    step="any"
                    :class="[styles.formInput, { error: newLocationLonError }]"
                    placeholder="e.g. -74.0060"
                    :disabled="isCreatingLocation"
                  />
                  <div v-if="newLocationLonError" :class="styles.fieldError">
                    {{ newLocationLonError }}
                  </div>
                </div>
              </div>

              <div :class="styles.locationActions">
                <button
                  type="button"
                  @click="cancelCreateLocation"
                  :class="styles.btnCancelSmall"
                  :disabled="isCreatingLocation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  @click="createLocation"
                  :class="styles.btnCreateSmall"
                  :disabled="isCreatingLocation || !isLocationFormValid"
                >
                  <span v-if="isCreatingLocation">Creating...</span>
                  <span v-else>Create</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Date and Time -->
          <div :class="styles.formRow">
            <div :class="styles.formGroup">
              <label for="date" :class="styles.formLabel">
                Date <span :class="styles.required">*</span>
              </label>
              <input
                id="date"
                v-model="formData.date"
                type="date"
                :class="[styles.formInput, { error: errors.date }]"
                :min="todayDate"
                :disabled="isSubmitting"
              />
              <div v-if="errors.date" :class="styles.fieldError">{{ errors.date }}</div>
            </div>

            <div :class="styles.formGroup">
              <label for="time" :class="styles.formLabel">
                Start Time <span :class="styles.required">*</span>
              </label>
              <input
                id="time"
                v-model="formData.time"
                type="time"
                :class="[styles.formInput, { error: errors.time }]"
                :disabled="isSubmitting"
              />
              <div v-if="errors.time" :class="styles.fieldError">{{ errors.time }}</div>
            </div>
          </div>

          <!-- Submit Error -->
          <div v-if="submitError" :class="styles.errorMessage">
            <p>{{ submitError }}</p>
          </div>
        </form>
      </div>

      <!-- Modal Footer -->
      <div :class="styles.modalFooter">
        <button type="button" @click="handleClose" :class="styles.btnCancel" :disabled="isSubmitting">
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :class="styles.btnPrimary"
          :disabled="isSubmitting || !isFormValid"
        >
          <span v-if="isSubmitting" :class="styles.btnLoading">
            <div :class="styles.btnSpinner"></div>
            Creating...
          </span>
          <span v-else>Create Training</span>
        </button>
      </div>
    </div>
  </div>
</template>
