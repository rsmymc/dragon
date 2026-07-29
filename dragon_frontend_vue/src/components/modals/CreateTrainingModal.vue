<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

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
  return (
    selectedTeamId.value &&
    formData.locationId &&
    formData.date &&
    formData.time &&
    !Object.values(errors).some((error) => error)
  )
})

// Methods
const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach((key) => (errors[key] = ''))

  let isValid = true

  if (!selectedTeamId.value) {
    errors.teamId = t('trainingModal.teamRequired')
    isValid = false
  }

  if (!formData.locationId) {
    errors.locationId = t('trainingModal.locationRequired')
    isValid = false
  }

  if (!formData.date) {
    errors.date = t('trainingModal.dateRequired')
    isValid = false
  } else if (formData.date < todayDate.value) {
    errors.date = t('trainingModal.datePast')
    isValid = false
  }

  if (!formData.time) {
    errors.time = t('trainingModal.timeRequired')
    isValid = false
  }

  return isValid
}

const loadInitialData = async () => {
  try {
    // Load teams if not pre-selected
    if (!props.teamId) {
      teamsLoading.value = true
      teams.value = (await teamsStore.fetchTeams()) || []
    }

    // Load locations for the selected team (locations are team-scoped)
    locationsLoading.value = true
    if (selectedTeamId.value) {
      locations.value = (await locationsStore.fetchLocationsByTeam(selectedTeamId.value)) || []
    } else {
      locations.value = []
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
    submitError.value = t('trainingModal.loadFailed')
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
      await locationsStore.fetchLocationsByTeam(formData.teamId)

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
  // Reset errors
  newLocationError.value = ''
  newLocationLatError.value = ''
  newLocationLonError.value = ''

  let isValid = true

  if (!newLocationName.value.trim()) {
    newLocationError.value = t('trainingModal.locationNameRequired')
    isValid = false
  }

  if (!newLocationLat.value) {
    newLocationLatError.value = t('trainingModal.latRequired')
    isValid = false
  }

  if (!newLocationLon.value) {
    newLocationLonError.value = t('trainingModal.lonRequired')
    isValid = false
  }

  if (!isValid) return

  isCreatingLocation.value = true

  try {
    const locationData = {
      name: newLocationName.value.trim(),
      team: selectedTeamId.value,
      lat: parseFloat(newLocationLat.value),
      lon: parseFloat(newLocationLon.value),
    }

    const newLocation = await locationsStore.createLocation(locationData)

    // Add to local locations list
    locations.value.push(newLocation)

    // Auto-select the new location
    formData.locationId = newLocation.id

    // Reset form
    cancelCreateLocation()
  } catch (error) {
    console.error('Error creating location:', error)
    newLocationError.value = error.message || t('trainingModal.createLocationFailed')
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
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    // Combine date and time into start_at datetime
    const startAt = new Date(`${formData.date}T${formData.time}:00`)

    const trainingData = {
      team: selectedTeamId.value,
      location: formData.locationId,
      start_at: startAt.toISOString(),
    }

    const newTraining = await trainingsStore.createTraining(trainingData)

    emit('success', newTraining)
    handleClose()
  } catch (error) {
    console.error('Error creating training:', error)
    submitError.value = error.message || t('trainingModal.createFailed')
  } finally {
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

// Watchers - re-validate a field once it already has an error
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
        <h3>{{ t('trainingModal.title') }}</h3>
        <button @click="handleClose" :class="styles.modalClose" :disabled="isSubmitting">×</button>
      </div>

      <!-- Modal Body -->
      <div :class="styles.modalBody">
        <form @submit.prevent="handleSubmit" :class="styles.trainingForm">
          <!-- Team Selection (if not pre-selected) -->
          <div v-if="!teamId" :class="styles.formGroup">
            <label for="team-select" :class="styles.formLabel">
              {{ t('trainingModal.team') }} <span :class="styles.required">*</span>
            </label>
            <select
              id="team-select"
              v-model="formData.teamId"
              :class="[styles.formInput, { [styles.error]: errors.teamId }]"
              :disabled="isSubmitting || teamsLoading"
              @change="onTeamChange"
            >
              <option value="">{{ t('trainingModal.chooseTeam') }}</option>
              <option v-for="team in teams" :key="team.id" :value="team.id">
                {{ team.name }}
              </option>
            </select>
            <div v-if="errors.teamId" :class="styles.fieldError">{{ errors.teamId }}</div>
          </div>

          <!-- Location Selection -->
          <div :class="styles.formGroup">
            <div :class="styles.labelRow">
              <label for="location-select" :class="styles.formLabel">
                {{ t('trainingModal.location') }} <span :class="styles.required">*</span>
              </label>
              <button
                v-if="selectedTeamId && !showCreateLocation"
                type="button"
                @click="showCreateLocation = true"
                :class="styles.addLocationLink"
                :disabled="isSubmitting"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {{ t('trainingModal.addLocation') }}
              </button>
            </div>
            <select
              id="location-select"
              v-model="formData.locationId"
              :class="[styles.formInput, { [styles.error]: errors.locationId }]"
              :disabled="isSubmitting || !selectedTeamId || locationsLoading"
            >
              <option value="">
                {{
                  !selectedTeamId
                    ? t('trainingModal.selectTeamFirst')
                    : locationsLoading
                      ? t('trainingModal.loadingLocations')
                      : t('trainingModal.chooseLocation')
                }}
              </option>
              <option v-for="location in filteredLocations" :key="location.id" :value="location.id">
                {{ location.name }}
              </option>
            </select>
            <div v-if="errors.locationId" :class="styles.fieldError">{{ errors.locationId }}</div>

            <!-- Helper when the team has no locations yet -->
            <div
              v-if="
                !filteredLocations.length &&
                selectedTeamId &&
                !locationsLoading &&
                !showCreateLocation
              "
              :class="styles.fieldHelp"
            >
              {{ t('trainingModal.noLocationsHelp') }}
            </div>

            <!-- Quick Location Creation Form -->
            <div v-if="showCreateLocation" :class="styles.createLocationForm">
              <div :class="styles.formGroup">
                <label :class="styles.formLabel">
                  {{ t('trainingModal.locationName') }} <span :class="styles.required">*</span>
                </label>
                <input
                  v-model="newLocationName"
                  type="text"
                  :class="[styles.formInput, { [styles.error]: newLocationError }]"
                  :placeholder="t('trainingModal.locationNamePlaceholder')"
                  :disabled="isCreatingLocation"
                />
                <div v-if="newLocationError" :class="styles.fieldError">{{ newLocationError }}</div>
              </div>

              <div :class="styles.formRow">
                <div :class="styles.formGroup">
                  <label :class="styles.formLabel">
                    {{ t('trainingModal.latitude') }} <span :class="styles.required">*</span>
                  </label>
                  <input
                    v-model="newLocationLat"
                    type="number"
                    step="any"
                    :class="[styles.formInput, { [styles.error]: newLocationLatError }]"
                    :placeholder="t('trainingModal.latPlaceholder')"
                    :disabled="isCreatingLocation"
                  />
                  <div v-if="newLocationLatError" :class="styles.fieldError">
                    {{ newLocationLatError }}
                  </div>
                </div>

                <div :class="styles.formGroup">
                  <label :class="styles.formLabel">
                    {{ t('trainingModal.longitude') }} <span :class="styles.required">*</span>
                  </label>
                  <input
                    v-model="newLocationLon"
                    type="number"
                    step="any"
                    :class="[styles.formInput, { [styles.error]: newLocationLonError }]"
                    :placeholder="t('trainingModal.lonPlaceholder')"
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
                  {{ t('common.cancel') }}
                </button>
                <button
                  type="button"
                  @click="createLocation"
                  :class="styles.btnCreateSmall"
                  :disabled="isCreatingLocation || !isLocationFormValid"
                >
                  <span v-if="isCreatingLocation">{{ t('trainingModal.creatingLocation') }}</span>
                  <span v-else>{{ t('common.create') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Date and Time -->
          <div :class="styles.formRow">
            <div :class="styles.formGroup">
              <label for="date" :class="styles.formLabel">
                {{ t('trainingModal.date') }} <span :class="styles.required">*</span>
              </label>
              <input
                id="date"
                v-model="formData.date"
                type="date"
                :class="[styles.formInput, { [styles.error]: errors.date }]"
                :min="todayDate"
                :disabled="isSubmitting"
              />
              <div v-if="errors.date" :class="styles.fieldError">{{ errors.date }}</div>
            </div>

            <div :class="styles.formGroup">
              <label for="time" :class="styles.formLabel">
                {{ t('trainingModal.startTime') }} <span :class="styles.required">*</span>
              </label>
              <input
                id="time"
                v-model="formData.time"
                type="time"
                :class="[styles.formInput, { [styles.error]: errors.time }]"
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
        <button
          type="button"
          @click="handleClose"
          :class="styles.btnCancel"
          :disabled="isSubmitting"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :class="styles.btnPrimary"
          :disabled="isSubmitting || !isFormValid"
        >
          <span v-if="isSubmitting" :class="styles.btnLoading">
            <div :class="styles.btnSpinner"></div>
            {{ t('trainingModal.creating') }}
          </span>
          <span v-else>{{ t('trainingModal.submit') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
