<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrainingsStore } from '@/stores/trainings'
import { useMembershipStore } from '@/stores/membership'
import { useLineupsStore } from '@/stores/lineups'
import { MEMBERSHIP_ROLE_LABELS, PERSON_SIDE_LABELS } from '@/constants'
import styles from '@/assets/styles/training-details.module.css'

// Composables
const route = useRoute()
const trainingsStore = useTrainingsStore()
const membershipStore = useMembershipStore()
const lineupsStore = useLineupsStore()

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

const assignedMembers = computed(() => {
  return localLineupSeats.value.filter((seat) => seat.person).map((seat) => seat.person)
})

const maxSeatNumber = computed(() => {
  if (!lineup.value?.seats || lineup.value.seats.length === 0) {
    return 8
  }
  const maxSeat = Math.max(...lineup.value.seats.map((seat) => seat.seat_number))
  return Math.max(maxSeat, 8)
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

const getSeatPosition = (personId) => {
  const seat = localLineupSeats.value.find((s) => s.person?.id === personId)
  return seat ? `${seat.side}${seat.seat_number}` : ''
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

const clearLineup = () => {
  const confirmed = confirm('Clear all seat assignments? This action cannot be undone.')
  if (!confirmed) return

  localLineupSeats.value = localLineupSeats.value.map((seat) => ({
    ...seat,
    person: null,
  }))
}

const highlightSeat = (personId) => {
  const position = getSeatPosition(personId)
  highlightedSeat.value = position
  setTimeout(() => {
    highlightedSeat.value = null
  }, 2000)
}

const discardChanges = () => {
  const confirmed = confirm('Discard all unsaved changes? This action cannot be undone.')
  if (!confirmed) return
  initializeLocalState()
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

const unpublishLineup = async () => {
  isUpdatingLineup.value = true

  try {
    await lineupsStore.updateLineupState(lineup.value.id, 1)
    lineup.value.state = 1
  } catch (err) {
    console.error('Error unpublishing lineup:', err)
    alert('Failed to unpublish lineup. Please try again.')
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
              <h1>Training Session</h1>
              <div :class="styles.trainingBadges">
                <span v-if="isPastTraining" :class="[styles.statusBadge, styles.past]">Completed</span>
                <span v-else-if="isToday" :class="[styles.statusBadge, styles.today]">Today</span>
                <span v-else-if="isTomorrow" :class="[styles.statusBadge, styles.soon]">Tomorrow</span>
                <span v-if="lineup?.state === 2" :class="[styles.statusBadge, styles.published]"
                >Lineup Published</span
                >
                <span v-else-if="lineup?.state === 1" :class="[styles.statusBadge, styles.draft]">Draft Lineup</span>
                <span v-if="hasUnsavedChanges" :class="[styles.statusBadge, styles.unsaved]">Unsaved Changes</span>
              </div>
            </div>

            <div :class="styles.trainingStats">
              <div :class="styles.statItem">
                <span :class="styles.statLabel">When</span>
                <span :class="styles.statValue">{{ formatTrainingDateTime(training.start_at) }}</span>
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

          <!-- Action Buttons -->
          <div :class="styles.headerActions">
            <button
              v-if="hasUnsavedChanges"
              @click="discardChanges"
              :class="styles.btnSecondary"
              :disabled="isUpdatingLineup"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Discard Changes
            </button>
            <button
              v-if="lineup && (lineup.state === 1 || hasUnsavedChanges)"
              @click="publishLineup"
              :class="styles.btnPublish"
              :disabled="isUpdatingLineup"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              {{ hasUnsavedChanges ? 'Save & Publish Lineup' : 'Publish Lineup' }}
            </button>
            <button
              v-if="lineup && lineup.state === 2 && !hasUnsavedChanges"
              @click="unpublishLineup"
              :class="styles.btnSecondary"
              :disabled="isUpdatingLineup"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
                />
              </svg>
              Edit Lineup
            </button>
          </div>
        </div>
      </div>

      <!-- Lineup Section -->
      <div :class="styles.lineupSection">
        <div :class="styles.sectionContent">
          <div :class="styles.lineupHeader">
            <h2>Dragon Boat Lineup</h2>
            <div :class="styles.lineupStats">
              <span class="stat">{{ assignedSeatsCount }}/16 seats filled</span>
              <button
                v-if="lineup"
                @click="clearLineup"
                :class="styles.btnClear"
                :disabled="isUpdatingLineup"
              >
                Clear All
              </button>
            </div>
          </div>

          <!-- Drag and Drop Instructions -->
          <div v-if="!lineup || assignedSeatsCount === 0" :class="styles.instructions">
            <p>
              <strong>Drag & Drop:</strong> Drag team members from the left panel into boat seats on
              the right to create your lineup. You can also drag between seats to rearrange or swap
              positions. Changes are saved locally until you publish.
            </p>
          </div>

          <!-- Unsaved Changes Warning -->
          <div v-if="hasUnsavedChanges" :class="styles.unsavedWarning">
            <div :class="styles.warningIcon">💾</div>
            <div :class="styles.warningContent">
              <p><strong>You have unsaved changes!</strong></p>
              <p>
                Your lineup changes are saved locally. Click "Save & Publish Lineup" to make them
                permanent.
              </p>
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
                    :class="[styles.memberCard, 'draggable', { dragging: dragActive && draggedMember?.id === member.id }]"
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
                        <span v-if="member.height" :class="styles.statItem">{{ member.height }}cm</span>
                        <span v-if="member.weight" :class="styles.statItem">{{ member.weight }}kg</span>
                        <span
                          :class="[styles.statItem, styles.preferredSide, `side-${member.side?.toLowerCase()}`]"
                        >
                          {{ getSideLabel(member.side) }}
                        </span>
                      </div>
                    </div>
                    <div :class="styles.dragHandle">⋮⋮</div>
                  </div>
                </div>

                <!-- No Available Members -->
                <div v-else :class="styles.noAvailableMembers">
                  <div :class="styles.emptyIcon">✨</div>
                  <p>All team members are in the lineup!</p>
                </div>

                <!-- Assigned Members Summary -->
                <div v-if="assignedMembers.length > 0" :class="styles.assignedSummary">
                  <h4>In Lineup ({{ assignedMembers.length }})</h4>
                  <div :class="styles.assignedChips">
                    <div
                      v-for="member in assignedMembers"
                      :key="member.id"
                      :class="styles.assignedChip"
                      @click="highlightSeat(member.id)"
                    >
                      <div :class="styles.chipAvatar">
                        {{ getInitials(member.name) }}
                      </div>
                      <span :class="styles.chipName">{{ member.name }}</span>
                      <span :class="styles.chipPosition">{{ getSeatPosition(member.id) }}</span>
                    </div>
                  </div>
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
                    <div :class="styles.dragonHead">🐲</div>
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
                            :class="[styles.seatPerson, { dragging: dragActive && draggedFromSeat === `L${seatNum}` }]"
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
                              <div :class="styles.personName">{{ getSeatPerson('L', seatNum).name }}</div>
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
                            <div :class="styles.seatHint">Drop Here</div>
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
                            :class="[styles.seatPerson, { dragging: dragActive && draggedFromSeat === `R${seatNum}` }]"
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
                              <div :class="styles.personName">{{ getSeatPerson('R', seatNum).name }}</div>
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
                            <div :class="styles.seatHint">Drop Here</div>
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

