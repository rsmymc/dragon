<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import styles from '@/assets/styles/edit-team.module.css'

// Composables
const router = useRouter()
const route = useRoute()
const teamsStore = useTeamsStore()

// Reactive data
const team = ref(null)
const formError = ref('')
const errors = reactive({})

// Form data
const formData = reactive({
  name: '',
  max_members: 22,
  city: '',
})

// Computed
const isFormValid = computed(() => {
  return formData.name.trim().length > 0 && Object.keys(errors).length === 0
})

// Methods
const loadTeam = async () => {
  const teamId = route.params.id

  try {
    // Check if team is already in store
    const existingTeam = teamsStore.getTeamById(teamId)
    if (existingTeam) {
      team.value = existingTeam
      populateForm(existingTeam)
      return
    }

    // Fetch from API
    await teamsStore.fetchTeam(teamId)
    team.value = teamsStore.currentTeam

    if (team.value) {
      populateForm(team.value)
    } else {
      throw new Error('Team not found')
    }
  } catch (error) {
    console.error('Failed to load team:', error)
    // Error is handled by the template through teamsStore.error
  }
}

const populateForm = (teamData) => {
  formData.name = teamData.name || ''
  formData.max_members = teamData.max_members || 22
  formData.city = teamData.city || ''
}

const validateForm = () => {
  // Clear previous errors
  Object.keys(errors).forEach((key) => delete errors[key])

  // Name validation
  if (!formData.name.trim()) {
    errors.name = 'Team name is required'
  } else if (formData.name.length < 2) {
    errors.name = 'Team name must be at least 2 characters'
  } else if (formData.name.length > 100) {
    errors.name = 'Team name must be less than 100 characters'
  }

  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  formError.value = ''

  // Validate form
  if (!validateForm()) {
    formError.value = 'Please fix the errors above'
    return
  }

  try {
    const result = await teamsStore.updateTeam(route.params.id, formData)

    if (result.success) {
      const from = route.query.from

      if (from === 'detail') {
        router.push(`/teams/${route.params.id}`)
      } else {
        router.push('/teams')
      }
    } else {
      formError.value = result.error || 'Failed to update team'
    }
  } catch (error) {
    console.error('Update error:', error)
    formError.value = 'An unexpected error occurred. Please try again.'
  }
}

// Lifecycle
onMounted(() => {
  loadTeam()
})
</script>

<template>
  <div :class="styles.editTeamView">
    <!-- Loading State -->
    <div v-if="teamsStore.isLoading && !team" :class="styles.loadingState">
      <div :class="styles.loadingSpinner"></div>
      <p>Loading team details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="teamsStore.error && !team" :class="styles.errorState">
      <div :class="styles.errorIcon">⚠️</div>
      <h3>Error Loading Team</h3>
      <p>{{ teamsStore.error }}</p>
      <button @click="loadTeam" :class="styles.btnRetry">Try Again</button>
      <router-link to="/teams" :class="styles.btnSecondary">← Back to Teams</router-link>
    </div>

    <!-- Edit Form -->
    <div v-else-if="team" :class="styles.editFormContainer">
      <!-- Header -->
      <div :class="styles.pageHeader">
        <div :class="styles.headerContent">
          <router-link to="/teams" :class="styles.backLink">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Teams
          </router-link>
          <h1>Edit Team: {{ team.name }}</h1>
          <p :class="styles.subtitle">Update your dragon boat team information</p>
        </div>
      </div>

      <!-- Edit Form -->
      <form @submit.prevent="handleSubmit" :class="styles.editForm">
        <!-- Team Name -->
        <div :class="styles.formGroup">
          <label for="name" :class="styles.formLabel">
            Team Name <span :class="styles.required">*</span>
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            :class="[styles.formInput, { error: errors.name }]"
            placeholder="Enter team name"
            required
          />
          <span v-if="errors.name" :class="styles.errorMessage">{{ errors.name }}</span>
        </div>

        <!-- Team Settings -->
        <div :class="styles.formRow">
          <div :class="styles.formGroup">
            <label for="max_members" :class="styles.formLabel">Max Members</label>
            <input
              id="max_members"
              v-model.number="formData.max_members"
              type="number"
              :class="styles.formInput"
              min="1"
              max="50"
              placeholder="22"
            />
            <span :class="styles.formHint">Standard dragon boat teams have 22 members</span>
          </div>
          <div :class="styles.formGroup">
            <label for="city" :class="styles.formLabel">City/Location</label>
            <input
              id="city"
              v-model="formData.city"
              type="text"
              :class="styles.formInput"
              placeholder="Team location"
            />
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="formError" :class="styles.formError">
          <div :class="styles.errorIcon">⚠️</div>
          <p>{{ formError }}</p>
        </div>

        <!-- Form Actions -->
        <div :class="styles.formActions">
          <router-link to="/teams" :class="styles.btnCancel">Cancel</router-link>
          <button
            type="submit"
            :class="styles.btnPrimary"
            :disabled="teamsStore.isLoading || !isFormValid"
          >
            <span v-if="teamsStore.isLoading" :class="[styles.loadingSpinner, 'small']"></span>
            {{ teamsStore.isLoading ? 'Updating...' : 'Update Team' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
