<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocationsStore } from '@/stores/locations.js'
import { useTrainingsStore } from '@/stores/trainings.js'
import styles from '@/assets/styles/create-training.module.css'

// Props
const props = defineProps({
  training: {
    type: Object,
    required: true,
  },
  teamId: {
    type: String,
    required: true,
  },
})

// Emits
const emit = defineEmits(['close', 'success'])

// Stores
const locationsStore = useLocationsStore()
const trainingsStore = useTrainingsStore()
const { t } = useI18n()

// State
const locations = ref([])
const isSubmitting = ref(false)
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

// Split the existing start_at back into local date + time for the inputs
const splitDateTime = (iso) => {
  if (!iso) return { date: '', time: '09:00' }
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

const initial = splitDateTime(props.training.start_at)

const formData = reactive({
  locationId: props.training.location?.id || '',
  date: initial.date,
  time: initial.time,
})

const errors = reactive({
  locationId: '',
  date: '',
  time: '',
})

// Computed
const todayDate = computed(() => new Date().toISOString().split('T')[0])

const filteredLocations = computed(() => {
  return locations.value.filter((location) => location.team?.id === props.teamId)
})

const isLocationFormValid = computed(() => {
  return newLocationName.value.trim() && newLocationLat.value && newLocationLon.value
})

const isFormValid = computed(() => {
  return (
    formData.locationId &&
    formData.date &&
    formData.time &&
    !Object.values(errors).some((error) => error)
  )
})

// Methods
const validateForm = () => {
  Object.keys(errors).forEach((key) => (errors[key] = ''))
  let isValid = true

  if (!formData.locationId) {
    errors.locationId = t('trainingModal.locationRequired')
    isValid = false
  }
  if (!formData.date) {
    errors.date = t('trainingModal.dateRequired')
    isValid = false
  }
  if (!formData.time) {
    errors.time = t('trainingModal.timeRequired')
    isValid = false
  }

  return isValid
}

const loadLocations = async () => {
  locationsLoading.value = true
  try {
    locations.value = (await locationsStore.fetchLocationsByTeam(props.teamId)) || []
  } catch (error) {
    console.error('Error loading locations:', error)
  } finally {
    locationsLoading.value = false
  }
}

const createLocation = async () => {
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
      team: props.teamId,
      lat: parseFloat(newLocationLat.value),
      lon: parseFloat(newLocationLon.value),
    }
    const newLocation = await locationsStore.createLocation(locationData)
    locations.value.push(newLocation)
    formData.locationId = newLocation.id
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
    const startAt = new Date(`${formData.date}T${formData.time}:00`)
    const trainingData = {
      team: props.teamId,
      location: formData.locationId,
      start_at: startAt.toISOString(),
    }

    const updated = await trainingsStore.updateTraining(props.training.id, trainingData)

    emit('success', updated)
    handleClose()
  } catch (error) {
    console.error('Error updating training:', error)
    submitError.value = error.message || t('trainingModal.updateFailed')
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  emit('close')
}

const handleOverlayClick = () => {
  if (!isSubmitting.value) handleClose()
}

// Re-validate a field once it already has an error
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

onMounted(() => {
  loadLocations()
})
</script>

<template>
  <div :class="styles.modalOverlay" @click="handleOverlayClick">
    <div :class="styles.modalContent" @click.stop>
      <!-- Modal Header -->
      <div :class="styles.modalHeader">
        <h3>{{ t('trainingModal.editTitle') }}</h3>
        <button @click="handleClose" :class="styles.modalClose" :disabled="isSubmitting">×</button>
      </div>

      <!-- Modal Body -->
      <div :class="styles.modalBody">
        <form @submit.prevent="handleSubmit" :class="styles.trainingForm">
          <!-- Location Selection -->
          <div :class="styles.formGroup">
            <div :class="styles.labelRow">
              <label for="location-select" :class="styles.formLabel">
                {{ t('trainingModal.location') }} <span :class="styles.required">*</span>
              </label>
              <button
                v-if="!showCreateLocation"
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
              :disabled="isSubmitting || locationsLoading"
            >
              <option value="">
                {{
                  locationsLoading
                    ? t('trainingModal.loadingLocations')
                    : t('trainingModal.chooseLocation')
                }}
              </option>
              <option v-for="location in filteredLocations" :key="location.id" :value="location.id">
                {{ location.name }}
              </option>
            </select>
            <div v-if="errors.locationId" :class="styles.fieldError">{{ errors.locationId }}</div>

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
            {{ t('trainingModal.saving') }}
          </span>
          <span v-else>{{ t('trainingModal.saveChanges') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
