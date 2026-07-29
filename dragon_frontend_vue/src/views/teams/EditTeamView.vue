<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTeamsStore } from '@/stores/teams'
import styles from '@/assets/styles/edit-team.module.css'

// Composables
const router = useRouter()
const route = useRoute()
const teamsStore = useTeamsStore()
const { t } = useI18n()

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

// Where to return to, based on where the user came from (?from=detail|list)
const backTarget = computed(() =>
  route.query.from === 'detail' ? `/teams/${route.params.id}/trainings` : '/teams',
)
// t() inside a computed stays reactive: the label re-evaluates on locale change
const backLabel = computed(() =>
  route.query.from === 'detail' ? t('editTeam.backToTeam') : t('editTeam.backToTeams'),
)

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
    errors.name = t('editTeam.nameRequired')
  } else if (formData.name.length < 2) {
    errors.name = t('editTeam.nameMinLength')
  } else if (formData.name.length > 100) {
    errors.name = t('editTeam.nameMaxLength')
  }

  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  formError.value = ''

  // Validate form
  if (!validateForm()) {
    formError.value = t('editTeam.fixErrors')
    return
  }

  try {
    const result = await teamsStore.updateTeam(route.params.id, formData)

    if (result.success) {
      router.push(backTarget.value)
    } else {
      formError.value = result.error || t('editTeam.updateFailed')
    }
  } catch (error) {
    console.error('Update error:', error)
    formError.value = t('common.unexpectedError')
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
      <p>{{ t('editTeam.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="teamsStore.error && !team" :class="styles.errorState">
      <div :class="styles.errorIcon">⚠️</div>
      <h3>{{ t('editTeam.errorTitle') }}</h3>
      <p>{{ teamsStore.error }}</p>
      <button @click="loadTeam" :class="styles.btnRetry">{{ t('common.tryAgain') }}</button>
      <router-link to="/teams" :class="styles.btnSecondary">
        ← {{ t('editTeam.backToTeams') }}
      </router-link>
    </div>

    <!-- Edit Form -->
    <div v-else-if="team" :class="styles.editFormContainer">
      <!-- Header -->
      <div :class="styles.pageHeader">
        <div :class="styles.headerContent">
          <router-link :to="backTarget" :class="styles.backLink">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {{ backLabel }}
          </router-link>
          <h1>{{ t('editTeam.title', { name: team.name }) }}</h1>
          <!--          <p :class="styles.subtitle">Update your dragon boat team information</p>-->
        </div>
      </div>

      <!-- Edit Form -->
      <form @submit.prevent="handleSubmit" :class="styles.editForm">
        <!-- Team Name -->
        <div :class="styles.formGroup">
          <label for="name" :class="styles.formLabel">
            {{ t('editTeam.nameLabel') }} <span :class="styles.required">*</span>
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            :class="[styles.formInput, { [styles.error]: errors.name }]"
            :placeholder="t('editTeam.namePlaceholder')"
            required
          />
          <span v-if="errors.name" :class="styles.errorMessage">{{ errors.name }}</span>
        </div>

        <!-- Team Settings -->
        <div :class="styles.formRow">
          <div :class="styles.formGroup">
            <label for="max_members" :class="styles.formLabel">
              {{ t('editTeam.maxMembersLabel') }}
            </label>
            <input
              id="max_members"
              v-model.number="formData.max_members"
              type="number"
              :class="styles.formInput"
              min="1"
              max="50"
              placeholder="22"
            />
            <span :class="styles.formHint">{{ t('editTeam.maxMembersHelp') }}</span>
          </div>
          <div :class="styles.formGroup">
            <label for="city" :class="styles.formLabel">{{ t('editTeam.cityLabel') }}</label>
            <input
              id="city"
              v-model="formData.city"
              type="text"
              :class="styles.formInput"
              :placeholder="t('editTeam.cityPlaceholder')"
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
          <router-link :to="backTarget" :class="styles.btnCancel">
            {{ t('common.cancel') }}
          </router-link>
          <button
            type="submit"
            :class="styles.btnPrimary"
            :disabled="teamsStore.isLoading || !isFormValid"
          >
            <span v-if="teamsStore.isLoading" :class="[styles.loadingSpinner, styles.small]"></span>
            {{ teamsStore.isLoading ? t('editTeam.submitting') : t('editTeam.submit') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
