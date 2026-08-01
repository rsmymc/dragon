<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTrainingsStore } from '@/stores/trainings'
import { useMembershipStore } from '@/stores/membership'
import { useLineupsStore } from '@/stores/lineups'
import { useAttendanceStore } from '@/stores/attendance'
import { useAuthStore } from '@/stores/auth'
import { PERSON_SIDE_KEYS } from '@/constants'
import styles from '@/assets/styles/training-details.module.css'

// Composables
const route = useRoute()
const trainingsStore = useTrainingsStore()
const membershipStore = useMembershipStore()
const lineupsStore = useLineupsStore()
const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()
const { t, locale } = useI18n()

// Reactive state
const training = ref(null)
const lineup = ref(null)
const members = ref([])
const isLoading = ref(false)
const isUpdatingLineup = ref(false)
const error = ref('')
const dragActive = ref(false)
const draggedMember = ref(null)
const draggedFromSeat = ref(null)
const dragType = ref(null)
const highlightedSeat = ref(null)

// Local state management
const localLineupSeats = ref([])
const hasUnsavedChanges = ref(false)
const originalSeatsSnapshot = ref([])

// Computed
const trainingId = computed(() => route.params.id)

const isPastTraining = computed(() => {
  if (!training.value) return false
  return new Date(training.value.start_at) <= new Date()
})

const availableMembers = computed(() => {
  const assignedPersonIds = localLineupSeats.value
      .filter((seat) => seat.person)
      .map((seat) => seat.person.id)
  return members.value.filter((member) => !assignedPersonIds.includes(member.id))
})

// Left-panel filters
const onlyPresent = ref(false)
const sideFilter = ref('') // '' = all, 1 = left, 2 = right, 0 = both

// labelKey is resolved with t() in the template so the chips stay reactive
const sideFilters = [
  { value: '', labelKey: 'trainingDetail.sideFilters.all' },
  { value: 1, labelKey: 'trainingDetail.sideFilters.left' },
  { value: 2, labelKey: 'trainingDetail.sideFilters.right' },
  { value: 0, labelKey: 'trainingDetail.sideFilters.both' },
]

const filteredAvailableMembers = computed(() => {
  return availableMembers.value.filter((member) => {
    if (onlyPresent.value && attendanceForPerson(member.id) !== true) return false
    if (sideFilter.value !== '' && Number(member.side) !== Number(sideFilter.value)) return false
    return true
  })
})

const maxSeatNumber = computed(() => {
  if (!lineup.value?.seats || lineup.value.seats.length === 0) {
    return 8
  }
  const maxSeat = Math.max(...lineup.value.seats.map((seat) => seat.seat_number))
  return Math.max(maxSeat, 8)
})

// Instructions tooltip text (computed so it follows the active locale)
const dragTip = computed(() => t('trainingDetail.dragTip'))

// Google Maps link for the training location (coords if available, else name search)
const locationMapUrl = computed(() => {
  const loc = training.value?.location
  if (!loc) return null
  if (loc.lat != null && loc.lon != null) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}`
  }
  if (loc.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}`
  }
  return null
})

// Watch for changes
watch(
    localLineupSeats,
    () => {
      checkForUnsavedChanges()
    },
    { deep: true },
)

// Methods
const loadTraining = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const trainingData = await trainingsStore.fetchTraining(trainingId.value)
    training.value = trainingData

    if (training.value.team?.id) {
      await membershipStore.fetchTeamMemberships(training.value.team.id)
      members.value = membershipStore.teamMemberships.map((m) => ({
        ...m.person,
        role: m.role,
      }))
      await attendanceStore.fetchRoster(trainingId.value) // ← add this line
    }

    await loadLineup()
  } catch (err) {
    console.error('Error loading training:', err)
    error.value = err.message || t('trainingDetail.loadFailed')
  } finally {
    isLoading.value = false
  }
}

const loadLineup = async () => {
  try {
    lineup.value = await lineupsStore.fetchTrainingLineup(trainingId.value)
    initializeLocalState()
  } catch (err) {
    if (err.status === 404) {
      lineup.value = await lineupsStore.createLineup(trainingId.value)
      initializeLocalState()
    } else {
      throw err
    }
  }
}

const initializeLocalState = () => {
  if (lineup.value?.seats) {
    localLineupSeats.value = JSON.parse(JSON.stringify(lineup.value.seats))
    originalSeatsSnapshot.value = JSON.parse(JSON.stringify(lineup.value.seats))
  } else {
    localLineupSeats.value = []
    originalSeatsSnapshot.value = []
  }
  hasUnsavedChanges.value = false
}

const checkForUnsavedChanges = () => {
  const currentState = JSON.stringify(
      localLineupSeats.value
          .map((seat) => ({
            side: seat.side,
            seat_number: seat.seat_number,
            person_id: seat.person?.id || null,
          }))
          .sort((a, b) => `${a.side}${a.seat_number}`.localeCompare(`${b.side}${b.seat_number}`)),
  )

  const originalState = JSON.stringify(
      originalSeatsSnapshot.value
          .map((seat) => ({
            side: seat.side,
            seat_number: seat.seat_number,
            person_id: seat.person?.id || null,
          }))
          .sort((a, b) => `${a.side}${a.seat_number}`.localeCompare(`${b.side}${b.seat_number}`)),
  )

  hasUnsavedChanges.value = currentState !== originalState
}

const getSeatPerson = (side, seatNumber) => {
  const seat = localLineupSeats.value.find((s) => s.side === side && s.seat_number === seatNumber)
  return seat?.person || null
}

// Left vs right weight balance (drummer/steerer sit on the centerline, excluded).
// Missing weights are simply ignored.
const boatBalance = computed(() => {
  let left = 0
  let right = 0
  for (const seat of localLineupSeats.value) {
    const w = Number(seat.person?.weight)
    if (!seat.person || !w) continue
    if (seat.side === 'L') left += w
    else if (seat.side === 'R') right += w
  }
  return {
    left,
    right,
    diff: Math.abs(left - right),
    heavier: left === right ? null : left > right ? 'L' : 'R',
  }
})

const hasLocalSeatChange = (side, seatNumber) => {
  if (!hasUnsavedChanges.value) return false

  const currentSeat = localLineupSeats.value.find(
      (s) => s.side === side && s.seat_number === seatNumber,
  )
  const originalSeat = originalSeatsSnapshot.value.find(
      (s) => s.side === side && s.seat_number === seatNumber,
  )

  const currentPersonId = currentSeat?.person?.id || null
  const originalPersonId = originalSeat?.person?.id || null

  return currentPersonId !== originalPersonId
}

const handleDragStart = (event, member) => {
  const dragData = { type: 'member', member }
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  dragActive.value = true
  draggedMember.value = member
  dragType.value = 'member'
}

const handleSeatDragStart = (event, person, side, seatNumber) => {
  const dragData = { type: 'seat', person, fromSide: side, fromSeatNumber: seatNumber }
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  dragActive.value = true
  draggedMember.value = person
  draggedFromSeat.value = `${side}${seatNumber}`
  dragType.value = 'seat'
}

const handleDragEnd = () => {
  dragActive.value = false
  draggedMember.value = null
  draggedFromSeat.value = null
  dragType.value = null
  highlightedSeat.value = null
}

const handleDragEnter = (event) => {
  event.preventDefault()
  if (dragActive.value) {
    event.currentTarget.classList.add('drag-over')
  }
}

const handleDragLeave = (event) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')
}

const handleSeatDrop = (event, toSide, toSeatNumber) => {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over')

  try {
    const dragData = JSON.parse(event.dataTransfer.getData('application/json'))

    if (dragData.type === 'member') {
      assignSeatLocally(toSide, toSeatNumber, dragData.member.id)
    } else if (dragData.type === 'seat') {
      handleSeatToSeatMove(dragData, toSide, toSeatNumber)
    }
  } catch (err) {
    console.error('Error handling seat drop:', err)
  }

  dragActive.value = false
  draggedMember.value = null
  draggedFromSeat.value = null
  dragType.value = null
  highlightedSeat.value = null
}

const handleSeatToSeatMove = (dragData, toSide, toSeatNumber) => {
  const { person: draggedPerson, fromSide, fromSeatNumber } = dragData

  if (fromSide === toSide && fromSeatNumber === toSeatNumber) {
    return
  }

  const targetSeatPerson = getSeatPerson(toSide, toSeatNumber)

  if (targetSeatPerson) {
    assignSeatLocally(fromSide, fromSeatNumber, targetSeatPerson.id)
  } else {
    removeSeatAssignment(fromSide, fromSeatNumber)
  }

  assignSeatLocally(toSide, toSeatNumber, draggedPerson.id)
}

const assignSeatLocally = (side, seatNumber, personId) => {
  const person = members.value.find((m) => m.id === personId)
  if (!person) return

  localLineupSeats.value = localLineupSeats.value.map((seat) =>
      seat.person?.id === personId ? { ...seat, person: null } : seat,
  )

  const existingIndex = localLineupSeats.value.findIndex(
      (s) => s.side === side && s.seat_number === seatNumber,
  )

  if (existingIndex >= 0) {
    localLineupSeats.value[existingIndex] = {
      ...localLineupSeats.value[existingIndex],
      person: person,
    }
  } else {
    localLineupSeats.value.push({
      side,
      seat_number: seatNumber,
      person: person,
    })
  }
}

const removeSeatAssignment = (side, seatNumber) => {
  const seatIndex = localLineupSeats.value.findIndex(
      (s) => s.side === side && s.seat_number === seatNumber,
  )
  if (seatIndex >= 0) {
    localLineupSeats.value[seatIndex] = {
      ...localLineupSeats.value[seatIndex],
      person: null,
    }
  }
}

const discardChanges = () => {
  const confirmed = confirm(t('trainingDetail.discardConfirm'))
  if (!confirmed) return
  initializeLocalState()
}

const saveDraft = async () => {
  isUpdatingLineup.value = true

  try {
    if (hasUnsavedChanges.value) {
      await syncLocalChangesToServer()
    }

    await lineupsStore.updateLineupState(lineup.value.id, 1)
    lineup.value.state = 1

    originalSeatsSnapshot.value = JSON.parse(JSON.stringify(localLineupSeats.value))
    hasUnsavedChanges.value = false
  } catch (err) {
    console.error('Error saving draft:', err)
    alert(t('trainingDetail.saveDraftFailed'))
  } finally {
    isUpdatingLineup.value = false
  }
}

const publishLineup = async () => {
  isUpdatingLineup.value = true

  try {
    if (hasUnsavedChanges.value) {
      await syncLocalChangesToServer()
    }

    await lineupsStore.updateLineupState(lineup.value.id, 2)
    lineup.value.state = 2

    originalSeatsSnapshot.value = JSON.parse(JSON.stringify(localLineupSeats.value))
    hasUnsavedChanges.value = false
  } catch (err) {
    console.error('Error publishing lineup:', err)
    alert(t('trainingDetail.publishFailed'))
  } finally {
    isUpdatingLineup.value = false
  }
}

const syncLocalChangesToServer = async () => {
  console.log('🔄 Syncing local changes to server...')

  if (lineup.value?.seats?.length > 0) {
    await lineupsStore.clearLineup(lineup.value.id)
  }

  const seatsToAssign = localLineupSeats.value.filter((seat) => seat.person)

  const assignmentPromises = seatsToAssign.map((seat) =>
      lineupsStore.assignSeat(lineup.value.id, seat.side, seat.seat_number, seat.person.id),
  )

  await Promise.all(assignmentPromises)

  lineup.value = await lineupsStore.fetchTrainingLineup(trainingId.value)
}

// Helper methods
// Locale-aware: 'en' / 'tr' are valid BCP 47 tags, so the active locale
// drives the format (including the 12- vs 24-hour convention).
const formatTrainingDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString(locale.value, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const getInitials = (name) => {
  return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
}

const getSideLabel = (side) => {
  const key = PERSON_SIDE_KEYS[side]
  return key ? t(`sides.${key}`) : t('common.unknown')
}

// Side chip colour: 1 = Left/Port (red), 2 = Right/Starboard (green), 0 = Both (none)
const sideClass = (side) => {
  if (side === 1) return styles.sideL
  if (side === 2) return styles.sideR
  return ''
}

// True if the seated person paddles a side that doesn't match this seat.
// person.side: 0 = both (never wrong), 1 = left only, 2 = right only.
const isWrongSide = (seatSide, seatNum) => {
  if (seatSide !== 'L' && seatSide !== 'R') return false
  const person = getSeatPerson(seatSide, seatNum)
  if (!person) return false
  const pref = Number(person.side)
  if (pref === 0) return false
  if (seatSide === 'L' && pref === 2) return true
  if (seatSide === 'R' && pref === 1) return true
  return false
}

// During a drag, highlight only the EMPTY seats that suit the dragged person's side.
// side 0 (both) suits any L/R seat; special seats (D/S) suit anyone.
const isMatchingTarget = (seatSide, seatNum) => {
  if (!dragActive.value || !draggedMember.value) return false
  if (getSeatPerson(seatSide, seatNum)) return false
  if (seatSide === 'D' || seatSide === 'S') return true
  const pref = Number(draggedMember.value.side)
  if (pref === 0) return true
  if (seatSide === 'L' && pref === 1) return true
  if (seatSide === 'R' && pref === 2) return true
  return false
}

// which membership row belongs to a given person (from the team roster already loaded)
const membershipByPersonId = computed(() => {
  const map = {}
  membershipStore.teamMemberships.forEach((m) => {
    map[m.person.id] = m
  })
  return map
})

// current user's membership + role on this team
const myMembership = computed(() => {
  const myPersonId = authStore.myPersonId
  if (!myPersonId) return null
  return membershipByPersonId.value[myPersonId] || null
})
const canMarkTeam = computed(() => [2, 3, 4].includes(myMembership.value?.role ?? null))

// attendance state for a person: true / false / null (not recorded)
const attendanceForPerson = (personId) => {
  const membership = membershipByPersonId.value[personId]
  if (!membership) return null
  const row = attendanceStore.roster.find((r) => r.membership === membership.id)
  return row ? row.attended : null
}

// can the current user edit THIS person's attendance?
const canEditAttendance = (personId) => {
  if (canMarkTeam.value) return true // coach/captain/manager: everyone
  return authStore.myPersonId === personId // player: only themselves
}

// saving guard, keyed by person id so only one toggle disables
const savingPersonId = ref(null)

// flip a person's attendance (null/absent -> present, present -> absent)
const toggleAttendance = async (personId) => {
  if (!canEditAttendance(personId) || savingPersonId.value) return

  const membership = membershipByPersonId.value[personId]
  if (!membership) return

  const current = attendanceForPerson(personId)
  const next = current === true ? false : true

  savingPersonId.value = personId
  try {
    if (canMarkTeam.value) {
      await attendanceStore.saveMarks(trainingId.value, [
        { membership: membership.id, attended: next },
      ])
    } else {
      // player marking self — uses the self endpoint (derives membership from token)
      await attendanceStore.markMine(trainingId.value, next)
    }
  } finally {
    savingPersonId.value = null
  }
}

// label/class helpers for the toggle
const attendanceClass = (personId) => {
  const v = attendanceForPerson(personId)
  if (v === true) return 'present'
  if (v === false) return 'absent'
  return 'unrecorded'
}

// Lifecycle
onMounted(() => {
  loadTraining()
})
</script>

<template>
  <div :class="styles.trainingDetailView">
    <!-- Loading State -->
    <div v-if="isLoading" :class="styles.loadingState">
      <div :class="styles.loadingSpinner"></div>
      <p>{{ t('trainingDetail.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="styles.errorState">
      <div :class="styles.errorIcon">⚠️</div>
      <h3>{{ t('trainingDetail.errorTitle') }}</h3>
      <p>{{ error }}</p>
      <button @click="loadTraining" :class="styles.btnRetry">{{ t('common.tryAgain') }}</button>
    </div>

    <!-- Training Details -->
    <div v-else-if="training" :class="styles.trainingDetailContainer">
      <!-- Header -->
      <router-link :to="`/teams/${training.team.id}/trainings`" :class="styles.backLink">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
          />
        </svg>
        {{ t('trainingDetail.backToTrainings') }}
      </router-link>

      <div :class="styles.trainingHeaderCard">
        <div v-if="isPastTraining" :class="styles.trainingBadges">
          <span :class="[styles.statusBadge, styles.past]">{{ t('trainings.completed') }}</span>
        </div>

        <div :class="styles.trainingStats">
          <div :class="styles.headerStatItem">
            <span :class="styles.headerStatLabel">{{ t('trainingDetail.when') }}</span>
            <span :class="styles.headerStatValue">{{
                formatTrainingDateTime(training.start_at)
              }}</span>
          </div>
          <div :class="styles.headerStatItem">
            <span :class="styles.headerStatLabel">{{ t('trainingDetail.location') }}</span>
            <a
                v-if="locationMapUrl"
                :href="locationMapUrl"
                target="_blank"
                rel="noopener noreferrer"
                :class="[styles.headerStatValue, styles.locationLink]"
            >
              {{ training.location?.name || t('common.unknown') }}
            </a>
            <span v-else :class="styles.headerStatValue">{{
                training.location?.name || t('common.unknown')
              }}</span>
          </div>
        </div>
      </div>

      <!-- Lineup Section -->
      <div :class="styles.lineupSection">
        <div :class="styles.sectionContent">
          <!-- Consolidated lineup bar: title + state + counter + actions -->
          <div :class="styles.lineupBar">
            <div :class="styles.lineupBarInfo">
              <div :class="styles.lineupTitleRow">
                <!-- Draft / Published pill -->
                <span v-if="lineup?.state === 2" :class="[styles.lineupPill, styles.published]">{{
                    t('trainingDetail.published')
                  }}</span>
                <span v-else :class="[styles.lineupPill, styles.draft]">{{
                    t('trainingDetail.draft')
                  }}</span>

                <!-- Instructions tooltip -->
                <span
                    :class="styles.infoTip"
                    tabindex="0"
                    :data-tip="dragTip"
                    :aria-label="t('trainingDetail.howToBuild')"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div :class="styles.lineupActions">
              <button
                  v-if="hasUnsavedChanges"
                  @click="discardChanges"
                  :class="styles.btnGhost"
                  :disabled="isUpdatingLineup"
              >
                {{ t('trainingDetail.discard') }}
              </button>
              <button
                  v-if="hasUnsavedChanges"
                  @click="saveDraft"
                  :class="styles.btnSecondary"
                  :disabled="isUpdatingLineup"
              >
                {{ t('trainingDetail.saveDraft') }}
              </button>
              <button
                  v-if="lineup && (lineup.state === 1 || hasUnsavedChanges)"
                  @click="publishLineup"
                  :class="styles.btnPublish"
                  :disabled="isUpdatingLineup"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                {{ t('trainingDetail.publish') }}
              </button>
            </div>
          </div>

          <!-- Main Lineup Interface -->
          <div :class="styles.lineupInterface">
            <!-- Left Panel: Available Members -->
            <div :class="styles.membersPanel">
              <!--              <div :class="styles.panelHeader">
                              <h3>{{ t('trainingDetail.availableMembers') }}</h3>
                            </div>-->

              <!-- Filters -->
              <div :class="styles.panelFilters">
                <label :class="styles.presentToggle">
                  <input type="checkbox" v-model="onlyPresent" />
                  {{ t('trainingDetail.presentOnly') }}
                </label>
                <div :class="styles.sideChips">
                  <button
                      v-for="sf in sideFilters"
                      :key="String(sf.value)"
                      type="button"
                      @click="sideFilter = sf.value"
                      :class="[styles.sideChip, { [styles.sideChipActive]: sideFilter === sf.value }]"
                  >
                    {{ t(sf.labelKey) }}
                  </button>
                </div>
              </div>

              <div :class="styles.membersScroll">
                <!-- Available Members -->
                <div
                    v-if="filteredAvailableMembers.length > 0"
                    :class="styles.availableMembersList"
                >
                  <div
                      v-for="member in filteredAvailableMembers"
                      :key="member.id"
                      :class="[
                      styles.memberCard,
                      'draggable',
                      { dragging: dragActive && draggedMember?.id === member.id },
                    ]"
                      draggable="true"
                      @dragstart="handleDragStart($event, member)"
                      @dragend="handleDragEnd"
                  >
                    <!-- Attendance toggle -->
                    <button
                        type="button"
                        :class="[styles.attToggleArea, 'att-toggle', attendanceClass(member.id)]"
                        :disabled="!canEditAttendance(member.id) || savingPersonId === member.id"
                        :title="
                        canEditAttendance(member.id)
                          ? t('trainingDetail.toggleAttendance')
                          : t('trainingDetail.viewOnly')
                      "
                        role="switch"
                        :aria-checked="attendanceForPerson(member.id) === true"
                        @click.stop="toggleAttendance(member.id)"
                        @dragstart.prevent.stop
                    >
                      <span class="att-knob"></span>
                    </button>

                    <h4 :class="styles.memberName">{{ member.name }}</h4>

                    <div :class="styles.memberStats">
                      <span v-if="member.weight" :class="styles.statChip"
                      >{{ member.weight }}kg</span
                      >
                      <span v-if="member.height" :class="styles.statChip"
                      >{{ member.height }}cm</span
                      >
                      <span :class="[styles.statChip, styles.sideStat, sideClass(member.side)]">
                        {{ getSideLabel(member.side) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Empty states -->
                <div v-else :class="styles.noAvailableMembers">
                  <div :class="styles.emptyIcon">
                    {{ availableMembers.length === 0 ? '' : '🔍' }}
                  </div>
                  <p>
                    {{
                      availableMembers.length === 0
                          ? t('trainingDetail.allInLineup')
                          : t('trainingDetail.noFilterMatch')
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Right Panel: Dragon Boat -->
            <div :class="styles.boatPanel">
              <div :class="[styles.dragonBoatContainer, { dropActive: dragActive }]">
                <div :class="styles.dragonBoatEnhanced">
                  <!-- Left/right weight balance (aligned under the columns) -->
                  <div :class="styles.balanceBar">
                    <span
                        :class="[
                        styles.balanceValue,
                        { [styles.balanceHeavier]: boatBalance.heavier === 'L' },
                      ]"
                    >{{ boatBalance.left }} kg</span
                    >
                    <span :class="styles.balanceDiff">{{
                        boatBalance.diff === 0 ? '=' : `Δ${boatBalance.diff}`
                      }}</span>
                    <span
                        :class="[
                        styles.balanceValue,
                        { [styles.balanceHeavier]: boatBalance.heavier === 'R' },
                      ]"
                    >{{ boatBalance.right }} kg</span
                    >
                  </div>

                  <!-- Legend aligned over the seat columns -->
                  <div :class="styles.boatLegend">
                    <span :class="[styles.legendItem, styles.port]">{{
                        t('trainingDetail.port')
                      }}</span>
                    <span></span>
                    <span :class="[styles.legendItem, styles.starboard]">{{
                        t('trainingDetail.starboard')
                      }}</span>
                  </div>

                  <!-- Drummer (front) -->
                  <div :class="styles.specialSection">
                    <div
                        :class="[
                        styles.specialSeat,
                        {
                          [styles.occupied]: getSeatPerson('D', 1),
                          [styles.dropTarget]: isMatchingTarget('D', 1),
                          [styles.localChange]: hasLocalSeatChange('D', 1),
                        },
                      ]"
                        @dragover.prevent
                        @dragenter.prevent="handleDragEnter"
                        @dragleave.prevent="handleDragLeave"
                        @drop="handleSeatDrop($event, 'D', 1)"
                    >
                      <div
                          v-if="getSeatPerson('D', 1)"
                          :class="[
                          styles.seatPerson,
                          { dragging: dragActive && draggedFromSeat === 'D1' },
                        ]"
                          draggable="true"
                          @dragstart="handleSeatDragStart($event, getSeatPerson('D', 1), 'D', 1)"
                          @dragend="handleDragEnd"
                      >
                        <span :class="styles.posIcon">🥁</span>
                        <div :class="styles.personName">{{ getSeatPerson('D', 1).name }}</div>
                        <button
                            @click="removeSeatAssignment('D', 1)"
                            :class="styles.removeBtn"
                            :title="t('trainingDetail.removeFromLineup')"
                        >
                          <svg
                              width="12"
                              height="12"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                          >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div v-else :class="styles.emptySpecial">
                        <span :class="styles.posIcon">🥁</span>
                        <span :class="styles.posLabel">{{ t('trainingDetail.drummer') }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Boat Body with Seats -->
                  <div :class="styles.boatBodySection">
                    <!-- Seat Rows -->
                    <div :class="styles.seatRows">
                      <div
                          v-for="seatNum in maxSeatNumber"
                          :key="seatNum"
                          :class="styles.seatRow"
                          :data-row="seatNum"
                      >
                        <!-- Left Seat (Port) -->
                        <div
                            :class="[
                            styles.boatSeat,
                            {
                              [styles.occupied]: getSeatPerson('L', seatNum),
                              [styles.dropTarget]: isMatchingTarget('L', seatNum),
                              [styles.highlighted]: highlightedSeat === `L${seatNum}`,
                              [styles.localChange]: hasLocalSeatChange('L', seatNum),
                              [styles.wrongSide]: isWrongSide('L', seatNum),
                            },
                          ]"
                            @dragover.prevent
                            @dragenter.prevent="handleDragEnter"
                            @dragleave.prevent="handleDragLeave"
                            @drop="handleSeatDrop($event, 'L', seatNum)"
                        >
                          <div
                              v-if="getSeatPerson('L', seatNum)"
                              :class="[
                              styles.seatPerson,
                              { dragging: dragActive && draggedFromSeat === `L${seatNum}` },
                            ]"
                              draggable="true"
                              @dragstart="
                              handleSeatDragStart($event, getSeatPerson('L', seatNum), 'L', seatNum)
                            "
                              @dragend="handleDragEnd"
                          >
                            <div :class="styles.personDetails">
                              <div :class="styles.personName">
                                {{ getSeatPerson('L', seatNum).name }}
                              </div>
                              <div :class="styles.seatLabel">
                                {{
                                  getSeatPerson('L', seatNum).weight
                                      ? `${getSeatPerson('L', seatNum).weight}kg`
                                      : `L${seatNum}`
                                }}
                              </div>
                            </div>
                            <button
                                @click="removeSeatAssignment('L', seatNum)"
                                :class="styles.removeBtn"
                                :title="t('trainingDetail.removeFromLineup')"
                            >
                              <svg
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2.5"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                          <div v-else :class="styles.emptySeat">
                            <div :class="styles.seatNumber">L{{ seatNum }}</div>
                            <div :class="styles.dropZone"></div>
                          </div>
                        </div>

                        <!-- Row Number -->
                        <div :class="styles.rowNumber">{{ seatNum }}</div>

                        <!-- Right Seat (Starboard) -->
                        <div
                            :class="[
                            styles.boatSeat,
                            {
                              [styles.occupied]: getSeatPerson('R', seatNum),
                              [styles.dropTarget]: isMatchingTarget('R', seatNum),
                              [styles.highlighted]: highlightedSeat === `R${seatNum}`,
                              [styles.localChange]: hasLocalSeatChange('R', seatNum),
                              [styles.wrongSide]: isWrongSide('R', seatNum),
                            },
                          ]"
                            @dragover.prevent
                            @dragenter.prevent="handleDragEnter"
                            @dragleave.prevent="handleDragLeave"
                            @drop="handleSeatDrop($event, 'R', seatNum)"
                        >
                          <div
                              v-if="getSeatPerson('R', seatNum)"
                              :class="[
                              styles.seatPerson,
                              { dragging: dragActive && draggedFromSeat === `R${seatNum}` },
                            ]"
                              draggable="true"
                              @dragstart="
                              handleSeatDragStart($event, getSeatPerson('R', seatNum), 'R', seatNum)
                            "
                              @dragend="handleDragEnd"
                          >
                            <div :class="styles.personDetails">
                              <div :class="styles.personName">
                                {{ getSeatPerson('R', seatNum).name }}
                              </div>
                              <div :class="styles.seatLabel">
                                {{
                                  getSeatPerson('R', seatNum).weight
                                      ? `${getSeatPerson('R', seatNum).weight}kg`
                                      : `R${seatNum}`
                                }}
                              </div>
                            </div>
                            <button
                                @click="removeSeatAssignment('R', seatNum)"
                                :class="styles.removeBtn"
                                :title="t('trainingDetail.removeFromLineup')"
                            >
                              <svg
                                  width="12"
                                  height="12"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2.5"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                          <div v-else :class="styles.emptySeat">
                            <div :class="styles.seatNumber">R{{ seatNum }}</div>
                            <div :class="styles.dropZone"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Steerer (back) -->
                  <div :class="styles.specialSection">
                    <div
                        :class="[
                        styles.specialSeat,
                        {
                          [styles.occupied]: getSeatPerson('S', 1),
                          [styles.dropTarget]: isMatchingTarget('S', 1),
                          [styles.localChange]: hasLocalSeatChange('S', 1),
                        },
                      ]"
                        @dragover.prevent
                        @dragenter.prevent="handleDragEnter"
                        @dragleave.prevent="handleDragLeave"
                        @drop="handleSeatDrop($event, 'S', 1)"
                    >
                      <div
                          v-if="getSeatPerson('S', 1)"
                          :class="[
                          styles.seatPerson,
                          { dragging: dragActive && draggedFromSeat === 'S1' },
                        ]"
                          draggable="true"
                          @dragstart="handleSeatDragStart($event, getSeatPerson('S', 1), 'S', 1)"
                          @dragend="handleDragEnd"
                      >
                        <span :class="styles.posIcon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
                            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
                          </svg>
                        </span>
                        <div :class="styles.personName">{{ getSeatPerson('S', 1).name }}</div>
                        <button
                            @click="removeSeatAssignment('S', 1)"
                            :class="styles.removeBtn"
                            :title="t('trainingDetail.removeFromLineup')"
                        >
                          <svg
                              width="12"
                              height="12"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                          >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2.5"
                                d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div v-else :class="styles.emptySpecial">
                        <span :class="styles.posIcon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                            <circle cx="12" cy="12" r="9" />
                            <circle cx="12" cy="12" r="2.25" fill="currentColor" stroke="none" />
                            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
                          </svg>
                        </span>
                        <span :class="styles.posLabel">{{ t('trainingDetail.steerer') }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.att-toggle {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  width: 38px;
  min-width: 38px;
  height: 22px;
  min-height: 22px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  padding: 0;
  background: var(--color-border);
  opacity: 0.7; /* recede while unmarked so it doesn't fight the drag UI */
  transition:
      background 0.15s ease,
      opacity 0.15s ease;
}
.att-toggle.present,
.att-toggle.absent {
  opacity: 1; /* a recorded state is full-strength */
}
.att-toggle.present {
  background: var(--color-success);
}
.att-toggle.absent {
  background: var(--color-danger);
}
.att-toggle:disabled {
  cursor: default;
}
.att-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}
.att-toggle.present .att-knob {
  transform: translateX(16px);
}
@media (max-width: 768px) {
  .att-toggle {
    width: 30px;
    min-width: 30px;
    height: 18px;
    min-height: 18px;
  }
  .att-knob {
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
  }
  .att-toggle.present .att-knob {
    transform: translateX(12px);
  }
}
</style>
