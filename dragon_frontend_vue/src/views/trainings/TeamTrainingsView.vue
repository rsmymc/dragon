<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTrainingsStore } from '@/stores/trainings'
import { useLocationsStore } from '@/stores/locations'
import { useTeamsStore } from '@/stores/teams'
import CreateTrainingModal from '@/components/modals/CreateTrainingModal.vue'
import '@/assets/styles/team-trainings.css'

const route = useRoute()
const trainingsStore = useTrainingsStore()
const locationsStore = useLocationsStore()
const teamsStore = useTeamsStore()

// Reactive state
const timeFilter = ref('upcoming')
const dateRange = ref({
  start: '',
  end: '',
})
const showCreateModal = ref(false)
// Computed
const teamId = computed(() => route.params.teamId)

const teamName = computed(() => {
  const team = teamsStore.getTeamById(teamId.value)
  return team?.name || 'Team'
})

const teamTrainings = computed(() => {
  return trainingsStore.getTrainingsByTeam(teamId.value)
})

const filteredTrainings = computed(() => {
  return trainingsStore.getFilteredTrainings({
    teamId: teamId.value,
    timeFilter: timeFilter.value,
    dateRange: dateRange.value.start || dateRange.value.end ? dateRange.value : null,
  })
})

const upcomingCount = computed(() => {
  return trainingsStore.getUpcomingTrainingsByTeam(teamId.value).length
})

const pastCount = computed(() => {
  return trainingsStore.getPastTrainingsByTeam(teamId.value).length
})

const totalCount = computed(() => {
  return trainingsStore.getTrainingsByTeam(teamId.value).length
})

const uniqueLocationsCount = computed(() => {
  const locationIds = [...new Set(teamTrainings.value.map((t) => t.location.id))]
  return locationIds.length
})

const nextTrainingDays = computed(() => {
  const now = new Date()
  const upcomingTrainings = teamTrainings.value
    .filter((training) => new Date(training.start_at) > now)
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))

  if (upcomingTrainings.length === 0) return '-'

  const nextTraining = upcomingTrainings[0]
  const diffTime = new Date(nextTraining.start_at) - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
})

// Methods
const loadTrainings = async () => {
  try {
    await trainingsStore.fetchTrainingsByTeam(teamId.value)
    await locationsStore.fetchLocationsByTeam(teamId.value)
  } catch (error) {
    console.error('Failed to load trainings:', error)
  }
}

const getLocationCoordinates = (locationId) => {
  const location = locationsStore.getLocationById(locationId)
  if (!location) return 'N/A'
  return {
    text: `${location.lat?.toFixed(4)}, ${location.lon?.toFixed(4)}`,
    url: `https://www.google.com/maps/@${location.lat},${location.lon},15z`,
  }
}

const formatTrainingDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTrainingTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const getRelativeDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1) return `In ${diffDays} days`
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`
  return 'Unknown'
}

const isPastTraining = (training) => {
  return new Date(training.start_at) <= new Date()
}

const isToday = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const isTomorrow = (dateString) => {
  const date = new Date(dateString)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

const isThisWeek = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  return date >= startOfWeek && date <= endOfWeek && !isToday(dateString) && !isTomorrow(dateString)
}

const getEmptyTitle = () => {
  switch (timeFilter.value) {
    case 'upcoming':
      return 'No upcoming trainings'
    case 'past':
      return 'No past trainings'
    default:
      return 'No trainings yet'
  }
}

const getEmptyMessage = () => {
  if (dateRange.value.start || dateRange.value.end) {
    return 'No trainings found in the selected date range.'
  }

  switch (timeFilter.value) {
    case 'upcoming':
      return 'Schedule your next training session to keep the team sharp!'
    case 'past':
      return 'No training history found for this team.'
    default:
      return 'Start organizing training sessions to build team fitness and skills.'
  }
}

const clearDateRange = () => {
  dateRange.value.start = ''
  dateRange.value.end = ''
}

const deleteTraining = async (training) => {
  const confirmed = confirm(
    `Delete training on ${formatTrainingDate(training.start_at)} at ${formatTrainingTime(training.start_at)}?\n\nThis action cannot be undone.`,
  )

  if (confirmed) {
    try {
      await trainingsStore.deleteTraining(training.id)
      console.log('✅ Training deleted successfully')
    } catch (error) {
      console.error('Delete training error:', error)
      alert('Failed to delete training. Please try again.')
    }
  }
}

const handleTrainingCreated = (newTraining) => {
  console.log('✅ Training created successfully:', newTraining)
  showCreateModal.value = false
  // The store will automatically update the trainings list
}

// Lifecycle
onMounted(() => {
  loadTrainings()
})
</script>
<template>
  <div class="team-trainings-view">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <router-link :to="`/teams/${teamId}`" class="back-link">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to {{ teamName }}
        </router-link>

        <div class="page-info">
          <h1>Training Sessions</h1>
          <p class="team-subtitle">{{ teamName }}</p>
        </div>

        <div class="header-actions">
          <button @click="showCreateModal = true" class="btn-primary">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Training
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-content">
        <!-- Time Filter Tabs -->
        <div class="filter-tabs">
          <button
            @click="timeFilter = 'upcoming'"
            :class="['tab-btn', { active: timeFilter === 'upcoming' }]"
          >
            Upcoming ({{ upcomingCount }})
          </button>
          <button
            @click="timeFilter = 'past'"
            :class="['tab-btn', { active: timeFilter === 'past' }]"
          >
            Past ({{ pastCount }})
          </button>
          <button
            @click="timeFilter = 'all'"
            :class="['tab-btn', { active: timeFilter === 'all' }]"
          >
            All ({{ totalCount }})
          </button>
        </div>

        <!-- Date Range Picker -->
        <div class="date-filters">
          <input
            v-model="dateRange.start"
            type="date"
            class="date-input"
            placeholder="Start date"
          />
          <span class="date-separator">to</span>
          <input v-model="dateRange.end" type="date" class="date-input" placeholder="End date" />
          <button
            v-if="dateRange.start || dateRange.end"
            @click="clearDateRange"
            class="clear-dates-btn"
            title="Clear date filter"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="trainingsStore.isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading trainings...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="trainingsStore.error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error Loading Trainings</h3>
      <p>{{ trainingsStore.error }}</p>
      <button @click="loadTrainings" class="btn-retry">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTrainings.length === 0" class="empty-state">
      <div class="empty-icon">🏃‍♂️</div>
      <h3>{{ getEmptyTitle() }}</h3>
      <p>{{ getEmptyMessage() }}</p>
      <button @click="showCreateModal = true" class="btn-primary">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Create First Training
      </button>
    </div>

    <!-- Trainings Grid -->
    <div v-else class="trainings-container">
      <div class="trainings-stats">
        <div class="stat-card">
          <div class="stat-number">{{ filteredTrainings.length }}</div>
          <div class="stat-label">
            {{
              timeFilter === 'upcoming' ? 'Upcoming' : timeFilter === 'past' ? 'Completed' : 'Total'
            }}
            Trainings
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ uniqueLocationsCount }}</div>
          <div class="stat-label">Training Locations</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ nextTrainingDays }}</div>
          <div class="stat-label">Days to Next Training</div>
        </div>
      </div>

      <div class="trainings-grid">
        <div
          v-for="training in filteredTrainings"
          :key="training.id"
          class="training-card"
          :class="{ past: isPastTraining(training) }"
        >
          <!-- Training Header -->
          <div class="training-header">
            <div class="training-date-time">
              <div class="training-date">
                {{ formatTrainingDate(training.start_at) }}
              </div>
              <div class="training-time">
                {{ formatTrainingTime(training.start_at) }}
              </div>
            </div>

            <div class="training-status-badges">
              <span v-if="isPastTraining(training)" class="status-badge past"> Completed </span>
              <span v-else-if="isToday(training.start_at)" class="status-badge today"> Today </span>
              <span v-else-if="isTomorrow(training.start_at)" class="status-badge soon">
                Tomorrow
              </span>
              <span v-else-if="isThisWeek(training.start_at)" class="status-badge this-week">
                This Week
              </span>
            </div>
          </div>

          <!-- Training Content -->
          <div class="training-content">
            <div class="training-location">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{{ training.location.name }}</span>
            </div>

            <div class="training-details">
              <div class="detail-row">
                <span class="detail-label">📅 Date:</span>
                <span class="detail-value">{{ getRelativeDate(training.start_at) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📍 Coordinates:</span>
                <a
                  v-if="getLocationCoordinates(training.location.id) !== 'N/A'"
                  :href="getLocationCoordinates(training.location.id).url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="detail-link"
                >
                  {{ getLocationCoordinates(training.location.id).text }}
                </a>
                <span v-else class="detail-value">N/A</span>
              </div>
            </div>
          </div>

          <!-- Training Actions -->
          <div class="training-actions">
            <router-link
              :to="`/teams/${teamId}/trainings/${training.id}`"
              class="action-btn primary"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Details
            </router-link>

            <!--            <router-link
              v-if="!isPastTraining(training)"
              :to="`/teams/${teamId}/trainings/${training.id}/edit`"
              class="action-btn secondary"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </router-link>-->

            <button @click="deleteTraining(training)" class="action-btn danger">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Create Training Modal -->
    <CreateTrainingModal
      v-if="showCreateModal"
      :team-id="teamId"
      :team-name="teamName"
      @close="showCreateModal = false"
      @success="handleTrainingCreated"
    />
  </div>
</template>
