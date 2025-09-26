<!-- EditTeamView.vue - Edit Team Form for Dragon Boat Teams -->
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import '@/assets/styles/edit-team.css';

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
  city: ''
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
  Object.keys(errors).forEach(key => delete errors[key])

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
  <div class="edit-team-view">
    <!-- Loading State -->
    <div v-if="teamsStore.isLoading && !team" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading team details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="teamsStore.error && !team" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error Loading Team</h3>
      <p>{{ teamsStore.error }}</p>
      <button @click="loadTeam" class="btn-retry">Try Again</button>
      <router-link to="/teams" class="btn-secondary">← Back to Teams</router-link>
    </div>

    <!-- Edit Form -->
    <div v-else-if="team" class="edit-form-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <router-link to="/teams" class="back-link">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Teams
          </router-link>
          <h1>Edit Team: {{ team.name }}</h1>
          <p class="subtitle">Update your dragon boat team information</p>
        </div>
      </div>

      <!-- Edit Form -->
      <form @submit.prevent="handleSubmit" class="edit-form">
        <!-- Team Name -->
        <div class="form-group">
          <label for="name" class="form-label">
            Team Name <span class="required">*</span>
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ 'error': errors.name }"
            placeholder="Enter team name"
            required
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>



        <!-- Team Settings -->
        <div class="form-row">
          <div class="form-group">
            <label for="max_members" class="form-label">Max Members</label>
            <input
              id="max_members"
              v-model.number="formData.max_members"
              type="number"
              class="form-input"
              min="1"
              max="50"
              placeholder="22"
            />
            <span class="form-hint">Standard dragon boat teams have 22 members</span>
          </div>
          <div class="form-group">
            <label for="city" class="form-label">City/Location</label>
            <input
              id="city"
              v-model="formData.city"
              type="text"
              class="form-input"
              placeholder="Team location"
            />
          </div>
        </div>
        <!-- Error Display -->
        <div v-if="formError" class="form-error">
          <div class="error-icon">⚠️</div>
          <p>{{ formError }}</p>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <router-link to="/teams" class="btn-cancel">Cancel</router-link>
          <button
            type="submit"
            class="btn-primary"
            :disabled="teamsStore.isLoading || !isFormValid"
          >
            <span v-if="teamsStore.isLoading" class="loading-spinner small"></span>
            {{ teamsStore.isLoading ? 'Updating...' : 'Update Team' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>


