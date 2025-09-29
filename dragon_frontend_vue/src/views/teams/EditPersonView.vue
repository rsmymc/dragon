<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePersonsStore } from '@/stores/persons'
import { PERSON_SIDE_LABELS } from '@/constants'
import '@/assets/styles/edit-person.css'

const route = useRoute()
const router = useRouter()
const personsStore = usePersonsStore()

// Reactive state
const person = ref(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref('')
const submitError = ref('')

const formData = reactive({
  name: '',
  phone: '',
  height: null,
  weight: null,
  side: null,
})

const errors = reactive({
  name: '',
  phone: '',
  height: '',
  weight: '',
  side: '',
})

// Computed properties
const personId = computed(() => route.params.id)

const isFormValid = computed(() => {
  return formData.name.trim() && !Object.values(errors).some((error) => error)
})

// Methods
const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach((key) => (errors[key] = ''))

  let isValid = true

  // Name validation
  if (!formData.name?.trim()) {
    errors.name = 'Name is required'
    isValid = false
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
    isValid = false
  }

  // Phone validation (optional but must be valid if provided)
  if (formData.phone?.trim()) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number'
      isValid = false
    }
  }

  // Height validation (optional but must be valid if provided)
  if (formData.height !== null && formData.height !== '') {
    if (formData.height < 100 || formData.height > 250) {
      errors.height = 'Height must be between 100-250 cm'
      isValid = false
    }
  }

  // Weight validation (optional but must be valid if provided)
  if (formData.weight !== null && formData.weight !== '') {
    if (formData.weight < 30 || formData.weight > 200) {
      errors.weight = 'Weight must be between 30-200 kg'
      isValid = false
    }
  }

  return isValid
}

const loadPerson = async () => {
  if (!personId.value) return

  isLoading.value = true
  loadError.value = ''

  try {
    const personData = await personsStore.fetchPerson(personId.value)
    if (personData) {
      person.value = personData
      // Populate form with existing data
      formData.name = personData.name || ''
      formData.phone = personData.phone || ''
      formData.height = personData.height
      formData.weight = personData.weight
      formData.side = personData.side
    } else {
      loadError.value = 'Person not found'
    }
  } catch (error) {
    console.error('Error loading person:', error)
    loadError.value = error.message || 'Failed to load person details'
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const updateData = {
      name: formData.name.trim(),
      phone: formData.phone?.trim() || null,
      height: formData.height || null,
      weight: formData.weight || null,
      side: formData.side || null,
    }

    await personsStore.updatePerson(personId.value, updateData)

    // Navigate back - try to go to previous page, fallback to persons list
    if (window.history.length > 1) {
      router.go(-1)
    } else {
      router.push('/persons')
    }
  } catch (error) {
    console.error('Error updating person:', error)
    submitError.value = error.message || 'Failed to save changes. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/persons')
  }
}

const handleBack = () => {
  handleCancel()
}

// Watchers
watch(
  () => formData.name,
  () => {
    if (errors.name) validateForm()
  },
)

watch(
  () => formData.phone,
  () => {
    if (errors.phone) validateForm()
  },
)

watch(
  () => formData.height,
  () => {
    if (errors.height) validateForm()
  },
)

watch(
  () => formData.weight,
  () => {
    if (errors.weight) validateForm()
  },
)

// Lifecycle
onMounted(() => {
  loadPerson()
})
</script>

<template>
  <div class="edit-person-view">
    <!-- Header -->
    <div class="header">
      <button @click="handleBack" class="back-btn" :disabled="isLoading">← Back</button>
      <h1 class="title">Edit Person</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !person" class="loading">
      <div class="spinner"></div>
      <p>Loading person details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="error-container">
      <div class="error-message">
        <h3>Error Loading Person</h3>
        <p>{{ loadError }}</p>
        <button @click="loadPerson" class="retry-btn">Retry</button>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-else-if="person" class="form-container">
      <form @submit.prevent="handleSubmit" class="edit-form">
        <!-- Name Field -->
        <div class="form-group">
          <label for="name" class="form-label"> Name <span class="required">*</span> </label>
          <input
            id="name"
            v-model.trim="formData.name"
            type="text"
            class="form-input"
            :class="{ error: errors.name }"
            placeholder="Enter full name"
            maxlength="100"
            :disabled="isSubmitting"
          />
          <div v-if="errors.name" class="field-error">{{ errors.name }}</div>
        </div>

        <!-- Phone Field -->
        <div class="form-group">
          <label for="phone" class="form-label">Phone</label>
          <input
            id="phone"
            v-model.trim="formData.phone"
            type="tel"
            class="form-input"
            :class="{ error: errors.phone }"
            placeholder="Enter phone number"
            maxlength="20"
            :disabled="isSubmitting"
          />
          <div v-if="errors.phone" class="field-error">{{ errors.phone }}</div>
        </div>

        <!-- Height Field -->
        <div class="form-group">
          <label for="height" class="form-label">Height (cm)</label>
          <input
            id="height"
            v-model.number="formData.height"
            type="number"
            class="form-input"
            :class="{ error: errors.height }"
            placeholder="Enter height in cm"
            min="100"
            max="250"
            step="1"
            :disabled="isSubmitting"
          />
          <div v-if="errors.height" class="field-error">{{ errors.height }}</div>
        </div>

        <!-- Weight Field -->
        <div class="form-group">
          <label for="weight" class="form-label">Weight (kg)</label>
          <input
            id="weight"
            v-model.number="formData.weight"
            type="number"
            class="form-input"
            :class="{ error: errors.weight }"
            placeholder="Enter weight in kg"
            min="30"
            max="200"
            step="1"
            :disabled="isSubmitting"
          />
          <div v-if="errors.weight" class="field-error">{{ errors.weight }}</div>
        </div>

        <!-- Side Field -->
        <div class="form-group">
          <label for="side" class="form-label">Preferred Side</label>
          <select
            id="side"
            v-model="formData.side"
            class="form-input"
            :class="{ error: errors.side }"
            :disabled="isSubmitting"
          >
            <option value="">Select preferred side</option>
            <option v-for="(label, value) in PERSON_SIDE_LABELS" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
          <div v-if="errors.side" class="field-error">{{ errors.side }}</div>
        </div>

        <!-- Submit Error -->
        <div v-if="submitError" class="error-message">
          <p>{{ submitError }}</p>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" @click="handleCancel" class="cancel-btn" :disabled="isSubmitting">
            Cancel
          </button>
          <button type="submit" class="save-btn" :disabled="isSubmitting || !isFormValid">
            <span v-if="isSubmitting" class="btn-loading">
              <div class="btn-spinner"></div>
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
