<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTeamsStore } from '@/stores/teams.js'
import styles from '@/assets/styles/create-team.module.css'

const router = useRouter()
const teamsStore = useTeamsStore()
const { t } = useI18n()

// Form data
const formData = ref({
  name: '',
  city: '',
  max_members: 22,
})

// Form validation and UI state
const errors = ref({})
const isLoading = computed(() => teamsStore.isLoading)
const showSuccess = ref(false)

// Form validation rules
const validateForm = () => {
  const newErrors = {}

  // Team name validation
  if (!formData.value.name.trim()) {
    newErrors.name = t('createTeam.nameRequired')
  } else if (formData.value.name.length < 3) {
    newErrors.name = t('createTeam.nameMinLength')
  } else if (formData.value.name.length > 80) {
    newErrors.name = t('createTeam.nameMaxLength')
  }

  // City validation (optional but if provided should be reasonable)
  if (formData.value.city && formData.value.city.length > 80) {
    newErrors.city = t('createTeam.cityMaxLength')
  }

  // Max members validation
  if (!formData.value.max_members || formData.value.max_members < 1) {
    newErrors.max_members = t('createTeam.maxMembersMin')
  } else if (formData.value.max_members > 50) {
    newErrors.max_members = t('createTeam.maxMembersMax')
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Clear error when user starts typing
const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    const result = await teamsStore.createTeam(formData.value)

    if (result.success) {
      showSuccess.value = true

      // Show success message briefly, then redirect
      setTimeout(() => {
        router.push('/teams')
      }, 2000)
    }
  } catch (error) {
    console.error('Error creating team:', error)
  }
}

// Cancel and go back
const handleCancel = () => {
  router.push('/teams')
}

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    city: '',
    max_members: 22,
  }
  errors.value = {}
  showSuccess.value = false
}

// Computed validation
const isFormValid = computed(() => {
  return (
    formData.value.name.trim() &&
    formData.value.max_members > 0 &&
    Object.keys(errors.value).length === 0
  )
})
</script>

<template>
  <div :class="styles.createTeamPage">
    <!-- Page Header -->
    <div :class="styles.pageHeader">
      <div :class="styles.headerLeft">
        <button @click="handleCancel" :class="styles.backButton">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {{ t('createTeam.backToTeams') }}
        </button>
        <!--        <div :class="styles.headerContent">
                  <h1 :class="styles.pageTitle">Create New Team</h1>
                  <p :class="styles.pageSubtitle">Add a new dragon boat team to your organization</p>
                </div>-->
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccess" :class="styles.successBanner">
      <svg :class="styles.successIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div :class="styles.successContent">
        <h3>{{ t('createTeam.successTitle') }}</h3>
        <p>{{ t('createTeam.successRedirect') }}</p>
      </div>
    </div>

    <!-- Create Team Form -->
    <div :class="styles.formContainer">
      <form @submit.prevent="handleSubmit" :class="styles.teamForm">
        <!-- Team Information Section -->
        <div :class="styles.formSection">
          <h2 :class="styles.sectionTitle">{{ t('createTeam.sectionTitle') }}</h2>

          <!-- Team Name -->
          <div :class="styles.formGroup">
            <label for="team-name" :class="styles.formLabel">
              {{ t('createTeam.nameLabel') }}
              <span :class="styles.required">*</span>
            </label>
            <input
              id="team-name"
              v-model="formData.name"
              @input="clearError('name')"
              @blur="validateForm"
              type="text"
              :class="[styles.formInput, { [styles.error]: errors.name }]"
              :placeholder="t('createTeam.namePlaceholder')"
              maxlength="80"
              required
            />
            <p v-if="errors.name" :class="styles.errorMessage">{{ errors.name }}</p>
          </div>

          <!-- City -->
          <div :class="styles.formGroup">
            <label for="city" :class="styles.formLabel">
              {{ t('createTeam.cityLabel') }} {{ t('common.optional') }}
            </label>
            <input
              id="city"
              v-model="formData.city"
              @input="clearError('city')"
              type="text"
              :class="[styles.formInput, { [styles.error]: errors.city }]"
              :placeholder="t('createTeam.cityPlaceholder')"
              maxlength="80"
            />
            <p :class="styles.fieldHelp">{{ t('createTeam.cityHelp') }}</p>
            <p v-if="errors.city" :class="styles.errorMessage">{{ errors.city }}</p>
          </div>

          <!-- Max Members -->
          <div :class="styles.formGroup">
            <label for="max-members" :class="styles.formLabel">
              {{ t('createTeam.maxMembersLabel') }}
              <span :class="styles.required">*</span>
            </label>
            <input
              id="max-members"
              v-model.number="formData.max_members"
              @input="clearError('max_members')"
              @blur="validateForm"
              type="number"
              :class="[
                styles.formInput,
                styles.numberInput,
                { [styles.error]: errors.max_members },
              ]"
              min="1"
              max="50"
              required
            />
            <p :class="styles.fieldHelp">{{ t('createTeam.maxMembersHelp') }}</p>
            <p v-if="errors.max_members" :class="styles.errorMessage">{{ errors.max_members }}</p>
          </div>
        </div>

        <!-- Form Actions -->
        <div :class="styles.formActions">
          <button
            type="button"
            @click="handleCancel"
            :class="styles.btnSecondary"
            :disabled="isLoading"
          >
            {{ t('common.cancel') }}
          </button>

          <div :class="styles.actionGroup">
            <button
              type="button"
              @click="resetForm"
              :class="styles.btnOutline"
              :disabled="isLoading"
            >
              {{ t('createTeam.resetForm') }}
            </button>

            <button type="submit" :class="styles.btnPrimary" :disabled="!isFormValid || isLoading">
              <svg v-if="isLoading" :class="styles.loadingSpinner" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{{ isLoading ? t('createTeam.submitting') : t('createTeam.submit') }}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
