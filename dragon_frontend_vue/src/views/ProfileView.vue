<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePersonsStore } from '@/stores/persons'
import { PERSON_SIDE_LABELS } from '@/constants'
import styles from '@/assets/styles/profile.module.css'

const authStore = useAuthStore()
const personsStore = usePersonsStore()

const isLoading = ref(true)
const loadError = ref('')
const isSubmitting = ref(false)
const submitError = ref('')
const justSaved = ref(false)

const person = ref(null)

const form = reactive({
  name: '',
  phone: '',
  height: '',
  weight: '',
  side: '',
})

const errors = reactive({
  name: '',
  phone: '',
  height: '',
  weight: '',
})

// '' / undefined -> null; numbers preserved (0 stays 0)
const norm = (v) => (v === '' || v === undefined ? null : v)

const loadProfile = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const personId = authStore.myPersonId
    if (!personId) {
      loadError.value = 'No profile is linked to your account yet.'
      return
    }

    const p = await personsStore.fetchPerson(personId)
    person.value = p
    form.name = p.name ?? ''
    form.phone = p.phone ?? ''
    form.height = p.height ?? ''
    form.weight = p.weight ?? ''
    form.side = p.side ?? ''
  } catch (error) {
    console.error('Failed to load profile:', error)
    loadError.value = 'Failed to load your profile. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  errors.name = ''
  errors.phone = ''
  errors.height = ''
  errors.weight = ''
  let ok = true

  if (!form.name.trim()) {
    errors.name = 'Name is required'
    ok = false
  }
  if (form.phone && !/^[+]?[\d\s\-()]+$/.test(form.phone)) {
    errors.phone = 'Please enter a valid phone number'
    ok = false
  }
  if (form.height && (form.height < 100 || form.height > 250)) {
    errors.height = 'Height should be between 100-250 cm'
    ok = false
  }
  if (form.weight && (form.weight < 30 || form.weight > 200)) {
    errors.weight = 'Weight should be between 30-200 kg'
    ok = false
  }

  return ok
}

const isValid = computed(() => {
  return (
    form.name.trim().length > 0 && !errors.name && !errors.phone && !errors.height && !errors.weight
  )
})

const handleSubmit = async () => {
  justSaved.value = false
  if (!validate() || isSubmitting.value || !person.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const candidate = {
      name: form.name.trim(),
      phone: norm(typeof form.phone === 'string' ? form.phone.trim() : form.phone),
      height: norm(form.height),
      weight: norm(form.weight),
      side: norm(form.side),
    }

    // Only send fields that actually changed
    const changes = {}
    for (const key of Object.keys(candidate)) {
      if (candidate[key] !== norm(person.value[key])) {
        changes[key] = candidate[key]
      }
    }

    if (Object.keys(changes).length === 0) {
      justSaved.value = true
      return
    }

    const result = await personsStore.updatePerson(person.value.id, changes)
    if (result && result.success === false) {
      throw new Error(result.error || 'Failed to save changes')
    }

    person.value = { ...person.value, ...changes }
    justSaved.value = true
  } catch (error) {
    console.error('Failed to update profile:', error)
    submitError.value = error.message || 'Failed to save changes. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div :class="styles.editPersonView">
    <div :class="styles.header">
      <h1 :class="styles.title">My Profile</h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" :class="styles.loading">
      <div :class="styles.spinner"></div>
      <p>Loading your profile...</p>
    </div>

    <!-- Load error -->
    <div v-else-if="loadError" :class="styles.errorContainer">
      <div :class="styles.errorMessage">
        <h3>Couldn't load profile</h3>
        <p>{{ loadError }}</p>
        <button @click="loadProfile" :class="styles.retryBtn">Try Again</button>
      </div>
    </div>

    <!-- Form -->
    <div v-else :class="styles.formContainer">
      <form @submit.prevent="handleSubmit" :class="styles.editForm">
        <div :class="styles.formGroup">
          <label for="name" :class="styles.formLabel">
            Name <span :class="styles.required">*</span>
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            :class="[styles.formInput, { [styles.error]: errors.name }]"
            placeholder="Your full name"
            :disabled="isSubmitting"
          />
          <span v-if="errors.name" :class="styles.fieldError">{{ errors.name }}</span>
        </div>

        <div :class="styles.formGroup">
          <label for="phone" :class="styles.formLabel">Phone</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            :class="[styles.formInput, { [styles.error]: errors.phone }]"
            placeholder="Your phone number"
            :disabled="isSubmitting"
          />
          <span v-if="errors.phone" :class="styles.fieldError">{{ errors.phone }}</span>
        </div>

        <div :class="styles.formGroup">
          <label for="height" :class="styles.formLabel">Height (cm)</label>
          <input
            id="height"
            v-model="form.height"
            type="number"
            :class="[styles.formInput, { [styles.error]: errors.height }]"
            placeholder="e.g. 175"
            min="100"
            max="250"
            :disabled="isSubmitting"
          />
          <span v-if="errors.height" :class="styles.fieldError">{{ errors.height }}</span>
        </div>

        <div :class="styles.formGroup">
          <label for="weight" :class="styles.formLabel">Weight (kg)</label>
          <input
            id="weight"
            v-model="form.weight"
            type="number"
            :class="[styles.formInput, { [styles.error]: errors.weight }]"
            placeholder="e.g. 72"
            min="30"
            max="200"
            :disabled="isSubmitting"
          />
          <span v-if="errors.weight" :class="styles.fieldError">{{ errors.weight }}</span>
        </div>

        <div :class="styles.formGroup">
          <label for="side" :class="styles.formLabel">Preferred Side</label>
          <select id="side" v-model="form.side" :class="styles.formInput" :disabled="isSubmitting">
            <option
              v-for="(label, value) in PERSON_SIDE_LABELS"
              :key="value"
              :value="Number(value)"
            >
              {{ label }}
            </option>
          </select>
        </div>

        <!-- Submit feedback -->
        <div v-if="submitError" :class="styles.errorMessage">{{ submitError }}</div>

        <div :class="styles.formActions">
          <span
            v-if="justSaved"
            style="
              margin-right: auto;
              align-self: center;
              color: var(--color-success);
              font-weight: 600;
            "
          >
            Saved ✓
          </span>
          <button type="submit" :class="styles.saveBtn" :disabled="isSubmitting || !isValid">
            <span v-if="isSubmitting" :class="styles.btnLoading">
              <span :class="styles.btnSpinner"></span>
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
