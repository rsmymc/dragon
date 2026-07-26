<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrainingsStore } from '@/stores/trainings'
import { useMembershipStore } from '@/stores/membership'
import { useLineupsStore } from '@/stores/lineups'
import { useAttendanceStore } from '@/stores/attendance'
import { useAuthStore } from '@/stores/auth'
import { MEMBERSHIP_ROLE_LABELS, PERSON_SIDE_LABELS } from '@/constants'
import styles from '@/assets/styles/training-details.module.css'

// Composables
const route = useRoute()
const trainingsStore = useTrainingsStore()
const membershipStore = useMembershipStore()
const lineupsStore = useLineupsStore()
const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

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

const isToday = computed(() => {
  if (!training.value) return false
  const date = new Date(training.value.start_at)
  const today = new Date()
  return date.toDateString() === today.toDateString()
})

const isTomorrow = computed(() => {
  if (!training.value) return false
  const date = new Date(training.value.start_at)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
})

const assignedSeatsCount = computed(() => {
  return localLineupSeats.value.filter((seat) => seat.person).length
})

const availableMembers = computed(() => {
  const assignedPersonIds = localLineupSeats.value
    .filter((seat) => seat.person)
    .map((seat) => seat.person.id)
  return members.value.filter((member) => !assignedPersonIds.includes(member.id))
})

const maxSeatNumber = computed(() => {
  if (!lineup.value?.seats || lineup.value.seats.length === 0) {
    return 8
  }
  const maxSeat = Math.max(...lineup.value.seats.map((seat) => seat.seat_number))
  return Math.max(maxSeat, 8)
})

// Instructions tooltip text
const dragTip =
  'Drag members from the left into boat seats, or drag between seats to rearrange or swap. Changes stay local until you publish.'

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
    error.value = err.message || 'Failed to load training details'
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
  const confirmed = confirm('Discard all unsaved changes? This action cannot be undone.')
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
    alert('Failed to save draft. Please try again.')
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
    alert('Failed to publish lineup. Please try again.')
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
const formatTrainingDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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

const getRoleLabel = (role) => {
  return MEMBERSHIP_ROLE_LABELS[role] || 'Unknown'
}

const getSideLabel = (side) => {
  return PERSON_SIDE_LABELS[side] || 'Unknown'
}

// Side chip colour: 1 = Left/Port (red), 2 = Right/Starboard (green), 0 = Both (none)
const sideClass = (side) => {
  if (side === 1) return styles.sideL
  if (side === 2) return styles.sideR
  return ''
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
      <p>Loading training details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="styles.errorState">
      <div :class="styles.errorIcon">⚠️</div>
      <h3>Error Loading Training</h3>
      <p>{{ error }}</p>
      <button @click="loadTraining" :class="styles.btnRetry">Try Again</button>
    </div>

    <!-- Training Details -->
    <div v-else-if="training" :class="styles.trainingDetailContainer">
      <!-- Header -->
      <div :class="styles.header">
        <div :class="styles.headerContent">
          <router-link :to="`/teams/${training.team.id}/trainings`" :class="styles.backLink">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Trainings
          </router-link>

          <div :class="styles.trainingInfo">
            <div :class="styles.trainingTitle">
              <div :class="styles.trainingBadges">
                <span v-if="isPastTraining" :class="[styles.statusBadge, styles.past]"
                  >Completed</span
                >
              </div>
            </div>

            <div :class="styles.trainingStats">
              <div :class="styles.statItem">
                <span :class="styles.statLabel">When</span>
                <span :class="styles.statValue">{{
                  formatTrainingDateTime(training.start_at)
                }}</span>
              </div>
              <div :class="styles.statItem">
                <span :class="styles.statLabel">Location</span>
                <span :class="styles.statValue">{{ training.location?.name || 'Unknown' }}</span>
              </div>
              <div :class="styles.statItem">
                <span :class="styles.statLabel">Team</span>
                <span :class="styles.statValue">{{ training.team?.name || 'Unknown' }}</span>
              </div>
            </div>
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
                <span v-if="lineup?.state === 2" :class="[styles.lineupPill, styles.published]"
                  >Published</span
                >
                <span v-else :class="[styles.lineupPill, styles.draft]">Draft</span>

                <!-- Instructions tooltip -->
                <span
                  :class="styles.infoTip"
                  tabindex="0"
                  :data-tip="dragTip"
                  aria-label="How to build the lineup"
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
                Discard
              </button>
              <button
                v-if="hasUnsavedChanges"
                @click="saveDraft"
                :class="styles.btnSecondary"
                :disabled="isUpdatingLineup"
              >
                Save Draft
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
                Publish
              </button>
            </div>
          </div>

          <!-- Main Lineup Interface -->
          <div :class="styles.lineupInterface">
            <!-- Left Panel: Available Members -->
            <div :class="styles.membersPanel">
              <div :class="styles.panelHeader">
                <h3>Available Members</h3>
                <div :class="styles.membersCount">{{ availableMembers.length }} available</div>
              </div>

              <div :class="styles.membersScroll">
                <!-- Available Members -->
                <div v-if="availableMembers.length > 0" :class="styles.availableMembersList">
                  <div
                    v-for="member in availableMembers"
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
                    <div :class="styles.memberAvatar">
                      <img
                        v-if="member.profile_picture_url"
                        :src="member.profile_picture_url"
                        :alt="member.name"
                        :class="styles.avatarImage"
                      />
                      <div v-else :class="styles.avatarInitial">
                        {{ getInitials(member.name) }}
                      </div>
                    </div>
                    <div :class="styles.memberInfo">
                      <h4 :class="styles.memberName">{{ member.name }}</h4>
                      <p :class="styles.memberRole">{{ getRoleLabel(member.role) }}</p>
                      <div :class="styles.memberStats">
                        <span v-if="member.height" :class="styles.statItem"
                          >{{ member.height }}cm</span
                        >
                        <span v-if="member.weight" :class="styles.statItem"
                          >{{ member.weight }}kg</span
                        >
                        <span
                          :class="[styles.statItem, styles.preferredSide, sideClass(member.side)]"
                        >
                          {{ getSideLabel(member.side) }}
                        </span>
                      </div>
                    </div>
                    <div :class="styles.dragHandle">⋮⋮</div>
                    <!-- Attendance toggle -->
                    <button
                      type="button"
                      class="att-toggle"
                      :class="attendanceClass(member.id)"
                      :disabled="!canEditAttendance(member.id) || savingPersonId === member.id"
                      :title="canEditAttendance(member.id) ? 'Toggle attendance' : 'View only'"
                      role="switch"
                      :aria-checked="attendanceForPerson(member.id) === true"
                      @click.stop="toggleAttendance(member.id)"
                      @dragstart.prevent.stop
                    >
                      <span class="att-knob"></span>
                    </button>
                  </div>
                </div>

                <!-- No Available Members -->
                <div v-else :class="styles.noAvailableMembers">
                  <div :class="styles.emptyIcon">✨</div>
                  <p>All team members are in the lineup!</p>
                </div>
              </div>
            </div>

            <!-- Right Panel: Dragon Boat -->
            <div :class="styles.boatPanel">
              <div :class="styles.panelHeader">
                <div :class="styles.boatLegend">
                  <span :class="[styles.legendItem, styles.port]">Port (Left)</span>
                  <span :class="[styles.legendItem, styles.starboard]">Starboard (Right)</span>
                </div>
              </div>

              <div :class="[styles.dragonBoatContainer, { dropActive: dragActive }]">
                <div :class="styles.dragonBoatEnhanced">
                  <!-- Dragon Head -->
                  <div :class="styles.dragonHeadSection">
                    <div :class="styles.dragonHead">🥁</div>
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
                            styles.portSeat,
                            {
                              occupied: getSeatPerson('L', seatNum),
                              dropTarget: dragActive,
                              highlighted: highlightedSeat === `L${seatNum}`,
                              localChange: hasLocalSeatChange('L', seatNum),
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
                            <div :class="styles.personAvatar">
                              {{ getInitials(getSeatPerson('L', seatNum).name) }}
                            </div>
                            <div :class="styles.personDetails">
                              <div :class="styles.personName">
                                {{ getSeatPerson('L', seatNum).name }}
                              </div>
                              <div :class="styles.seatLabel">L{{ seatNum }}</div>
                            </div>
                            <button
                              @click="removeSeatAssignment('L', seatNum)"
                              :class="styles.removeBtn"
                              title="Remove from lineup"
                            >
                              ✕
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
                            styles.starboardSeat,
                            {
                              occupied: getSeatPerson('R', seatNum),
                              dropTarget: dragActive,
                              highlighted: highlightedSeat === `R${seatNum}`,
                              localChange: hasLocalSeatChange('R', seatNum),
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
                            <div :class="styles.personAvatar">
                              {{ getInitials(getSeatPerson('R', seatNum).name) }}
                            </div>
                            <div :class="styles.personDetails">
                              <div :class="styles.personName">
                                {{ getSeatPerson('R', seatNum).name }}
                              </div>
                              <div :class="styles.seatLabel">R{{ seatNum }}</div>
                            </div>
                            <button
                              @click="removeSeatAssignment('R', seatNum)"
                              :class="styles.removeBtn"
                              title="Remove from lineup"
                            >
                              ✕
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

                  <!-- Drummer Position -->
                  <div :class="styles.drummerSection">
                    <div :class="styles.drummerSeat">🥁</div>
                    <div :class="styles.drummerLabel">Drummer</div>
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
</style>
