<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePersonsStore } from '@/stores/persons'
import { PERSON_SIDE_LABELS } from '@/constants'
import styles from '@/assets/styles/edit-person.module.css'

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
  <div :class="styles.editPersonView">
    <!-- Header -->
    <div :class="styles.header">
      <button @click="handleBack" :class="styles.backBtn" :disabled="isLoading">← Back</button>
      <h1 :class="styles.title">Edit Person</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !person" :class="styles.loading">
      <div :class="styles.spinner"></div>
      <p>Loading person details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" :class="styles.errorContainer">
      <div :class="styles.errorMessage">
        <h3>Error Loading Person</h3>
        <p>{{ loadError }}</p>
        <button @click="loadPerson" :class="styles.retryBtn">Retry</button>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-else-if="person" :class="styles.formContainer">
      <form @submit.prevent="handleSubmit" :class="styles.editForm">
        <!-- Name Field -->
        <div :class="styles.formGroup">
          <label for="name" :class="styles.formLabel">
            Name <span :class="styles.required">*</span>
          </label>
          <input
            id="name"
            v-model.trim="formData.name"
            type="text"
            :class="[styles.formInput, { error: errors.name }]"
            placeholder="Enter full name"
            maxlength="100"
            :disabled="isSubmitting"
          />
          <div v-if="errors.name" :class="styles.fieldError">{{ errors.name }}</div>
        </div>

        <!-- Phone Field -->
        <div :class="styles.formGroup">
          <label for="phone" :class="styles.formLabel">Phone</label>
          <input
            id="phone"
            v-model.trim="formData.phone"
            type="tel"
            :class="[styles.formInput, { error: errors.phone }]"
            placeholder="Enter phone number"
            maxlength="20"
            :disabled="isSubmitting"
          />
          <div v-if="errors.phone" :class="styles.fieldError">{{ errors.phone }}</div>
        </div>

        <!-- Height Field -->
        <div :class="styles.formGroup">
          <label for="height" :class="styles.formLabel">Height (cm)</label>
          <input
            id="height"
            v-model.number="formData.height"
            type="number"
            :class="[styles.formInput, { error: errors.height }]"
            placeholder="Enter height in cm"
            min="100"
            max="250"
            step="1"
            :disabled="isSubmitting"
          />
          <div v-if="errors.height" :class="styles.fieldError">{{ errors.height }}</div>
        </div>

        <!-- Weight Field -->
        <div :class="styles.formGroup">
          <label for="weight" :class="styles.formLabel">Weight (kg)</label>
          <input
            id="weight"
            v-model.number="formData.weight"
            type="number"
            :class="[styles.formInput, { error: errors.weight }]"
            placeholder="Enter weight in kg"
            min="30"
            max="200"
            step="1"
            :disabled="isSubmitting"
          />
          <div v-if="errors.weight" :class="styles.fieldError">{{ errors.weight }}</div>
        </div>

        <!-- Side Field -->
        <div :class="styles.formGroup">
          <label for="side" :class="styles.formLabel">Preferred Side</label>
          <select
            id="side"
            v-model="formData.side"
            :class="[styles.formInput, { error: errors.side }]"
            :disabled="isSubmitting"
          >
            <option value="">Select preferred side</option>
            <option v-for="(label, value) in PERSON_SIDE_LABELS" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
          <div v-if="errors.side" :class="styles.fieldError">{{ errors.side }}</div>
        </div>

        <!-- Submit Error -->
        <div v-if="submitError" :class="styles.errorMessage">
          <p>{{ submitError }}</p>
        </div>

        <!-- Form Actions -->
        <div :class="styles.formActions">
          <button
            type="button"
            @click="handleCancel"
            :class="styles.cancelBtn"
            :disabled="isSubmitting"
          >
            Cancel
          </button>
          <button type="submit" :class="styles.saveBtn" :disabled="isSubmitting || !isFormValid">
            <span v-if="isSubmitting" :class="styles.btnLoading">
              <div :class="styles.btnSpinner"></div>
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
