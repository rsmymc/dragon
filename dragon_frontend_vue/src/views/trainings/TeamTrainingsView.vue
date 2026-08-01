<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTrainingsStore } from '@/stores/trainings'
import { useLocationsStore } from '@/stores/locations'
import { useTeamsStore } from '@/stores/teams'
import { useAttendanceStore } from '@/stores/attendance'
import CreateTrainingModal from '@/components/modals/CreateTrainingModal.vue'
import EditTrainingModal from '@/components/modals/EditTrainingModal.vue'
import styles from '@/assets/styles/team-trainings.module.css'

const route = useRoute()
const trainingsStore = useTrainingsStore()
const locationsStore = useLocationsStore()
const teamsStore = useTeamsStore()
const attendanceStore = useAttendanceStore()
const { t, locale } = useI18n()

// Reactive state
const timeFilter = ref('upcoming')
const showCreateModal = ref(false)
const editingTraining = ref(null)
const savingTrainingId = ref(null)

// Param comes from the parent team layout route (/teams/:id)
const teamId = computed(() => route.params.id)

const teamName = computed(() => {
  const team = teamsStore.getTeamById(teamId.value)
  return team?.name || t('trainings.defaultTeamName')
})

// Only Captain/Coach/Manager can create/delete trainings (Player = 1)
const EDIT_ROLES = [2, 3, 4]
const canManage = computed(() => {
  const team = teamsStore.getTeamById(teamId.value)
  return EDIT_ROLES.includes(Number(team?.my_role))
})

const filteredTrainings = computed(() => {
  return trainingsStore.getFilteredTrainings({
    teamId: teamId.value,
    timeFilter: timeFilter.value,
    dateRange: null,
  })
})

const upcomingCount = computed(() => trainingsStore.getUpcomingTrainingsByTeam(teamId.value).length)
const pastCount = computed(() => trainingsStore.getPastTrainingsByTeam(teamId.value).length)
const totalCount = computed(() => trainingsStore.getTrainingsByTeam(teamId.value).length)

// Filter chips: labels carry their own count via {count} interpolation,
// so they stay correct in every language (no string concatenation).
const timeFilters = computed(() => [
  { value: 'upcoming', label: t('trainings.filters.upcoming', { count: upcomingCount.value }) },
  { value: 'past', label: t('trainings.filters.past', { count: pastCount.value }) },
  { value: 'all', label: t('trainings.filters.all', { count: totalCount.value }) },
])

// Methods
const loadTrainings = async () => {
  try {
    await trainingsStore.fetchTrainingsByTeam(teamId.value)
    await locationsStore.fetchLocationsByTeam(teamId.value)
    loadMyAttendance()
  } catch (error) {
    console.error('Failed to load trainings:', error)
  }
}

// One lightweight request per training (not the full team roster), fetched
// in parallel and cached in the store keyed by training id.
const loadMyAttendance = () => {
  const all = trainingsStore.getTrainingsByTeam(teamId.value)
  all.forEach((training) => {
    if (attendanceStore.myStatusByTraining[training.id] === undefined) {
      attendanceStore.fetchMyStatus(training.id).catch(() => {})
    }
  })
}

// true / false / null (not recorded) / undefined (not fetched yet)
const myAttendance = (trainingId) => attendanceStore.myStatusByTraining[trainingId]

const myAttendanceClass = (trainingId) => {
  const v = myAttendance(trainingId)
  if (v === true) return styles.present
  if (v === false) return styles.absent
  return ''
}

const toggleMyAttendance = async (training) => {
  if (savingTrainingId.value) return

  const current = myAttendance(training.id)
  const next = current === true ? false : true

  savingTrainingId.value = training.id
  try {
    await attendanceStore.markMine(training.id, next)
  } finally {
    savingTrainingId.value = null
  }
}

const getLocationCoordinates = (locationId) => {
  const location = locationsStore.getLocationById(locationId)
  if (!location) return null
  if (location.lat != null && location.lon != null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`
  }
  if (location.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`
  }
  return null
}

// Locale-aware formatting: 'en' / 'tr' are valid BCP 47 tags, so the active
// locale drives both the date and time format directly.
const formatTrainingDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatTrainingTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString(locale.value, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const isPastTraining = (training) => {
  return new Date(training.start_at) <= new Date()
}

const getEmptyTitle = () => {
  switch (timeFilter.value) {
    case 'upcoming':
      return t('trainings.emptyUpcomingTitle')
    case 'past':
      return t('trainings.emptyPastTitle')
    default:
      return t('trainings.emptyAllTitle')
  }
}

const emptyActionLabel = computed(() =>
  totalCount.value === 0 ? t('trainings.createFirst') : t('trainings.create'),
)

const deleteTraining = async (training) => {
  if (!canManage.value) return

  const confirmed = confirm(
    t('trainings.deleteConfirm', {
      date: formatTrainingDate(training.start_at),
      time: formatTrainingTime(training.start_at),
    }),
  )

  if (confirmed) {
    try {
      await trainingsStore.deleteTraining(training.id)
    } catch (error) {
      console.error('Delete training error:', error)
      alert(t('trainings.deleteFailed'))
    }
  }
}

const handleTrainingCreated = () => {
  showCreateModal.value = false
}

const handleTrainingUpdated = () => {
  editingTraining.value = null
}

// Lifecycle
onMounted(() => {
  loadTrainings()
})
</script>

<template>
  <div :class="styles.teamTrainingsView">
    <!-- Toolbar: filter chips + create (matches the members tab) -->
    <div :class="styles.toolbar">
      <div :class="styles.filterChips">
        <button
          v-for="tf in timeFilters"
          :key="tf.value"
          @click="timeFilter = tf.value"
          :class="[styles.chip, { [styles.chipActive]: timeFilter === tf.value }]"
        >
          {{ tf.label }}
        </button>
      </div>

      <button v-if="canManage" @click="showCreateModal = true" :class="styles.btnPrimary">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span :class="styles.addLabel">{{ t('trainings.create') }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="trainingsStore.isLoading" :class="styles.loadingState">
      <div :class="styles.loadingSpinner"></div>
      <p>{{ t('trainings.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="trainingsStore.error" :class="styles.errorState">
      <div :class="styles.errorIcon">⚠️</div>
      <h3>{{ t('trainings.errorTitle') }}</h3>
      <p>{{ trainingsStore.error }}</p>
      <button @click="loadTrainings" :class="styles.btnRetry">{{ t('common.tryAgain') }}</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTrainings.length === 0" :class="styles.emptyState">
      <!--      <div :class="styles.emptyIcon">🚣</div>-->
      <h3>{{ getEmptyTitle() }}</h3>
      <!--      <p>{{ getEmptyMessage() }}</p>-->
      <button v-if="canManage" @click="showCreateModal = true" :class="styles.btnPrimary">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        <span>{{ emptyActionLabel }}</span>
      </button>
    </div>

    <!-- Trainings Grid -->
    <div v-else :class="styles.trainingsGrid">
      <router-link
        v-for="training in filteredTrainings"
        :key="training.id"
        :to="`/teams/${teamId}/trainings/${training.id}`"
        :class="[styles.trainingCard, { [styles.past]: isPastTraining(training) }]"
      >
        <!-- Header: date/time + badge + actions -->
        <div :class="styles.trainingHeader">
          <div :class="styles.trainingDateTime">
            <div :class="styles.trainingDate">
              {{ formatTrainingDate(training.start_at) }}
              {{ formatTrainingTime(training.start_at) }}
            </div>
          </div>

          <div :class="styles.headerRight">
            <span v-if="isPastTraining(training)" :class="[styles.statusBadge, styles.past]">
              {{ t('trainings.completed') }}
            </span>

            <div v-if="canManage" :class="styles.cardActions">
              <button
                @click.stop.prevent="editingTraining = training"
                :class="[styles.actionBtn, styles.edit]"
                :title="t('trainings.editTitle')"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                @click.stop.prevent="deleteTraining(training)"
                :class="[styles.actionBtn, styles.delete]"
                :title="t('trainings.deleteTitle')"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer row: location (left) + my-attendance label & toggle (right) -->
        <div :class="styles.cardFooter">
          <!-- Location: icon is static, only the name text is a clickable link to the map coordinates -->
          <div :class="styles.trainingLocation">
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
            <a
              v-if="getLocationCoordinates(training.location.id) !== 'N/A'"
              :href="getLocationCoordinates(training.location.id)"
              target="_blank"
              rel="noopener noreferrer"
              :class="styles.locationLink"
              @click.stop
            >
              {{ training.location.name }}
            </a>
            <span v-else>{{ training.location.name }}</span>
          </div>

          <!-- My attendance: label + toggle, pinned to the right -->
          <div :class="styles.attGroup">
            <span :class="styles.attLabel">{{ t('trainings.myAttendance') }}</span>
            <button
              :class="[styles.attToggle, myAttendanceClass(training.id)]"
              :disabled="savingTrainingId === training.id"
              role="switch"
              :aria-checked="myAttendance(training.id) === true"
              :title="t('trainings.toggleMyAttendance')"
              @click.stop.prevent="toggleMyAttendance(training)"
            >
              <span :class="styles.attKnob"></span>
            </button>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Create Training Modal -->
    <CreateTrainingModal
      v-if="showCreateModal"
      :team-id="teamId"
      :team-name="teamName"
      @close="showCreateModal = false"
      @success="handleTrainingCreated"
    />

    <!-- Edit Training Modal -->
    <EditTrainingModal
      v-if="editingTraining"
      :training="editingTraining"
      :team-id="teamId"
      @close="editingTraining = null"
      @success="handleTrainingUpdated"
    />
  </div>
</template>
