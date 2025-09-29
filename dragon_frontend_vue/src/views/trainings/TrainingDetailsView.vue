<template>
  <div class="training-detail-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading training details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error Loading Training</h3>
      <p>{{ error }}</p>
      <button @click="loadTraining" class="btn-retry">Try Again</button>
    </div>

    <!-- Training Details -->
    <div v-else-if="training" class="training-detail-container">
      <!-- Header -->
      <div class="header">
        <div class="header-content">
          <router-link :to="`/teams/${training.team.id}/trainings`" class="back-link">
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

          <div class="training-info">
            <div class="training-title">
              <h1>Training Session</h1>
              <div class="training-badges">
                <span v-if="isPastTraining" class="status-badge past">Completed</span>
                <span v-else-if="isToday" class="status-badge today">Today</span>
                <span v-else-if="isTomorrow" class="status-badge soon">Tomorrow</span>
                <span v-if="lineup?.state === 2" class="status-badge published"
                  >Lineup Published</span
                >
                <span v-else-if="lineup?.state === 1" class="status-badge draft">Draft Lineup</span>
                <span v-if="hasUnsavedChanges" class="status-badge unsaved">Unsaved Changes</span>
              </div>
            </div>

            <div class="training-stats">
              <div class="stat-item">
                <span class="stat-label">When</span>
                <span class="stat-value">{{ formatTrainingDateTime(training.start_at) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Location</span>
                <span class="stat-value">{{ training.location?.name || 'Unknown' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Team</span>
                <span class="stat-value">{{ training.team?.name || 'Unknown' }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="header-actions">
            <button
              v-if="hasUnsavedChanges"
              @click="discardChanges"
              class="btn-secondary"
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
              class="btn-publish"
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
              class="btn-secondary"
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
      <div class="lineup-section">
        <div class="section-content">
          <div class="lineup-header">
            <h2>Dragon Boat Lineup</h2>
            <div class="lineup-stats">
              <span class="stat">{{ assignedSeatsCount }}/16 seats filled</span>
              <button
                v-if="lineup"
                @click="clearLineup"
                class="btn-clear"
                :disabled="isUpdatingLineup"
              >
                Clear All
              </button>
            </div>
          </div>

          <!-- Drag and Drop Instructions -->
          <div v-if="!lineup || assignedSeatsCount === 0" class="instructions">
            <p>
              <strong>Drag & Drop:</strong> Drag team members from the left panel into boat seats on
              the right to create your lineup. You can also drag between seats to rearrange or swap
              positions. Changes are saved locally until you publish.
            </p>
          </div>

          <!-- Unsaved Changes Warning -->
          <div v-if="hasUnsavedChanges" class="unsaved-warning">
            <div class="warning-icon">💾</div>
            <div class="warning-content">
              <p><strong>You have unsaved changes!</strong></p>
              <p>
                Your lineup changes are saved locally. Click "Save & Publish Lineup" to make them
                permanent.
              </p>
            </div>
          </div>

          <!-- Main Lineup Interface -->
          <div class="lineup-interface">
            <!-- Left Panel: Available Members -->
            <div class="members-panel">
              <div class="panel-header">
                <h3>Available Members</h3>
                <div class="members-count">{{ availableMembers.length }} available</div>
              </div>

              <div class="members-scroll">
                <!-- Available Members -->
                <div v-if="availableMembers.length > 0" class="available-members-list">
                  <div
                    v-for="member in availableMembers"
                    :key="member.id"
                    class="member-card draggable"
                    draggable="true"
                    @dragstart="handleDragStart($event, member)"
                    @dragend="handleDragEnd"
                    :class="{ dragging: dragActive && draggedMember?.id === member.id }"
                  >
                    <div class="member-avatar">
                      <img
                        v-if="member.profile_picture_url"
                        :src="member.profile_picture_url"
                        :alt="member.name"
                        class="avatar-image"
                      />
                      <div v-else class="avatar-initial">
                        {{ getInitials(member.name) }}
                      </div>
                    </div>
                    <div class="member-info">
                      <h4 class="member-name">{{ member.name }}</h4>
                      <p class="member-role">{{ getRoleLabel(member.role) }}</p>
                      <div class="member-stats">
                        <span v-if="member.height" class="stat-item">{{ member.height }}cm</span>
                        <span v-if="member.weight" class="stat-item">{{ member.weight }}kg</span>
                        <span
                          class="stat-item preferred-side"
                          :class="`side-${member.side?.toLowerCase()}`"
                        >
                          {{ getSideLabel(member.side) }}
                        </span>
                      </div>
                    </div>
                    <div class="drag-handle">⋮⋮</div>
                  </div>
                </div>

                <!-- No Available Members -->
                <div v-else class="no-available-members">
                  <div class="empty-icon">✨</div>
                  <p>All team members are in the lineup!</p>
                </div>

                <!-- Assigned Members Summary -->
                <div v-if="assignedMembers.length > 0" class="assigned-summary">
                  <h4>In Lineup ({{ assignedMembers.length }})</h4>
                  <div class="assigned-chips">
                    <div
                      v-for="member in assignedMembers"
                      :key="member.id"
                      class="assigned-chip"
                      @click="highlightSeat(member.id)"
                    >
                      <div class="chip-avatar">
                        {{ getInitials(member.name) }}
                      </div>
                      <span class="chip-name">{{ member.name }}</span>
                      <span class="chip-position">{{ getSeatPosition(member.id) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Panel: Dragon Boat -->
            <div class="boat-panel">
              <div class="panel-header">
                <div class="boat-legend">
                  <span class="legend-item port">Port (Left)</span>
                  <span class="legend-item starboard">Starboard (Right)</span>
                </div>
              </div>

              <div class="dragon-boat-container" :class="{ 'drop-active': dragActive }">
                <div class="dragon-boat-enhanced">
                  <!-- Dragon Head -->
                  <div class="dragon-head-section">
                    <div class="dragon-head">🐲</div>
                  </div>

                  <!-- Boat Body with Seats -->
                  <div class="boat-body-section">
                    <!-- Seat Rows -->
                    <div class="seat-rows">
                      <div
                        v-for="seatNum in maxSeatNumber"
                        :key="seatNum"
                        class="seat-row"
                        :data-row="seatNum"
                      >
                        <!-- Left Seat (Port) -->
                        <div
                          class="boat-seat port-seat"
                          :class="{
                            occupied: getSeatPerson('L', seatNum),
                            'drop-target': dragActive,
                            highlighted: highlightedSeat === `L${seatNum}`,
                            'local-change': hasLocalSeatChange('L', seatNum),
                          }"
                          @dragover.prevent
                          @dragenter.prevent="handleDragEnter"
                          @dragleave.prevent="handleDragLeave"
                          @drop="handleSeatDrop($event, 'L', seatNum)"
                        >
                          <div
                            v-if="getSeatPerson('L', seatNum)"
                            class="seat-person"
                            draggable="true"
                            @dragstart="
                              handleSeatDragStart($event, getSeatPerson('L', seatNum), 'L', seatNum)
                            "
                            @dragend="handleDragEnd"
                            :class="{ dragging: dragActive && draggedFromSeat === `L${seatNum}` }"
                          >
                            <div class="person-avatar">
                              {{ getInitials(getSeatPerson('L', seatNum).name) }}
                            </div>
                            <div class="person-details">
                              <div class="person-name">{{ getSeatPerson('L', seatNum).name }}</div>
                              <div class="seat-label">L{{ seatNum }}</div>
                            </div>
                            <button
                              @click="removeSeatAssignment('L', seatNum)"
                              class="remove-btn"
                              title="Remove from lineup"
                            >
                              ✕
                            </button>
                          </div>
                          <div v-else class="empty-seat">
                            <div class="seat-number">L{{ seatNum }}</div>
                            <div class="seat-hint">Drop Here</div>
                            <div class="drop-zone"></div>
                          </div>
                        </div>

                        <!-- Row Number -->
                        <div class="row-number">{{ seatNum }}</div>

                        <!-- Right Seat (Starboard) -->
                        <div
                          class="boat-seat starboard-seat"
                          :class="{
                            occupied: getSeatPerson('R', seatNum),
                            'drop-target': dragActive,
                            highlighted: highlightedSeat === `R${seatNum}`,
                            'local-change': hasLocalSeatChange('R', seatNum),
                          }"
                          @dragover.prevent
                          @dragenter.prevent="handleDragEnter"
                          @dragleave.prevent="handleDragLeave"
                          @drop="handleSeatDrop($event, 'R', seatNum)"
                        >
                          <div
                            v-if="getSeatPerson('R', seatNum)"
                            class="seat-person"
                            draggable="true"
                            @dragstart="
                              handleSeatDragStart($event, getSeatPerson('R', seatNum), 'R', seatNum)
                            "
                            @dragend="handleDragEnd"
                            :class="{ dragging: dragActive && draggedFromSeat === `R${seatNum}` }"
                          >
                            <div class="person-avatar">
                              {{ getInitials(getSeatPerson('R', seatNum).name) }}
                            </div>
                            <div class="person-details">
                              <div class="person-name">{{ getSeatPerson('R', seatNum).name }}</div>
                              <div class="seat-label">R{{ seatNum }}</div>
                            </div>
                            <button
                              @click="removeSeatAssignment('R', seatNum)"
                              class="remove-btn"
                              title="Remove from lineup"
                            >
                              ✕
                            </button>
                          </div>
                          <div v-else class="empty-seat">
                            <div class="seat-number">R{{ seatNum }}</div>
                            <div class="seat-hint">Drop Here</div>
                            <div class="drop-zone"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Drummer Position -->
                  <div class="drummer-section">
                    <div class="drummer-seat">🥁</div>
                    <div class="drummer-label">Drummer</div>
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

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrainingsStore } from '@/stores/trainings'
import { useMembershipStore } from '@/stores/membership'
import { useLineupsStore } from '@/stores/lineups'
import { MEMBERSHIP_ROLE_LABELS, PERSON_SIDE_LABELS } from '@/constants'

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
const draggedFromSeat = ref(null) // Track which seat we're dragging from
const dragType = ref(null) // 'member' or 'seat'
const highlightedSeat = ref(null)

// Local state management
const localLineupSeats = ref([]) // Local copy of seats for editing
const hasUnsavedChanges = ref(false)
const originalSeatsSnapshot = ref([]) // Snapshot of server state for comparison

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
  // Get max seat number from lineup data, default to 8 if no data
  if (!lineup.value?.seats || lineup.value.seats.length === 0) {
    return 8 // Default for dragon boat
  }

  const maxSeat = Math.max(...lineup.value.seats.map((seat) => seat.seat_number))
  return Math.max(maxSeat, 8) // Ensure at least 8 rows are shown
})

// Watch for changes in local seats to detect unsaved changes
watch(
  localLineupSeats,
  (newSeats) => {
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

    // Load team members
    if (training.value.team?.id) {
      await membershipStore.fetchTeamMemberships(training.value.team.id)
      members.value = membershipStore.teamMemberships.map((m) => ({
        ...m.person,
        role: m.role,
      }))
    }

    // Load or create lineup
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
    // If no lineup exists, create one
    if (err.status === 404) {
      lineup.value = await lineupsStore.createLineup(trainingId.value)
      initializeLocalState()
    } else {
      throw err
    }
  }
}

const initializeLocalState = () => {
  // Initialize local seats from server lineup
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
  // Compare current local state with original snapshot
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
      // Dragging from member panel to seat
      assignSeatLocally(toSide, toSeatNumber, dragData.member.id)
    } else if (dragData.type === 'seat') {
      // Dragging from seat to seat
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

  // Check if dropping on the same seat (no-op)
  if (fromSide === toSide && fromSeatNumber === toSeatNumber) {
    return
  }

  // Get the person currently in the target seat (if any)
  const targetSeatPerson = getSeatPerson(toSide, toSeatNumber)

  if (targetSeatPerson) {
    // Swap: person in target seat goes to source seat
    assignSeatLocally(fromSide, fromSeatNumber, targetSeatPerson.id)
  } else {
    // Clear the source seat since target is empty
    removeSeatAssignment(fromSide, fromSeatNumber)
  }

  // Move dragged person to target seat
  assignSeatLocally(toSide, toSeatNumber, draggedPerson.id)
}

const assignSeatLocally = (side, seatNumber, personId) => {
  const person = members.value.find((m) => m.id === personId)
  if (!person) return

  // Remove person from any existing seat (person can only be in one seat)
  localLineupSeats.value = localLineupSeats.value.map((seat) =>
    seat.person?.id === personId ? { ...seat, person: null } : seat,
  )

  // Find or create the target seat
  const existingIndex = localLineupSeats.value.findIndex(
    (s) => s.side === side && s.seat_number === seatNumber,
  )

  if (existingIndex >= 0) {
    // Update existing seat
    localLineupSeats.value[existingIndex] = {
      ...localLineupSeats.value[existingIndex],
      person: person,
    }
  } else {
    // Create new seat assignment
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

  // Clear all person assignments in local state
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

  // Reset to original state
  initializeLocalState()
}

const publishLineup = async () => {
  isUpdatingLineup.value = true

  try {
    // If we have unsaved changes, sync them to server first
    if (hasUnsavedChanges.value) {
      await syncLocalChangesToServer()
    }

    // Then publish the lineup
    await lineupsStore.updateLineupState(lineup.value.id, 2) // PUBLISHED
    lineup.value.state = 2

    // Update our snapshots since changes are now saved
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
    await lineupsStore.updateLineupState(lineup.value.id, 1) // DRAFT
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
  console.log('📋 Lineup ID:', lineup.value?.id)
  console.log(
    '💺 Local seats to sync:',
    localLineupSeats.value.filter((seat) => seat.person),
  )

  // Clear all existing seat assignments first
  if (lineup.value?.seats?.length > 0) {
    console.log('🧹 Clearing existing seats...')
    await lineupsStore.clearLineup(lineup.value.id)
  }

  // Then assign all seats that have people
  const seatsToAssign = localLineupSeats.value.filter((seat) => seat.person)
  console.log('✅ Assigning seats:', seatsToAssign)

  const assignmentPromises = seatsToAssign.map((seat) =>
    lineupsStore.assignSeat(lineup.value.id, seat.side, seat.seat_number, seat.person.id),
  )

  await Promise.all(assignmentPromises)

  // Refresh lineup from server to get updated data
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

<style scoped>
.training-detail-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* Loading & Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #64748b;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #123157;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: #123157;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-retry:hover {
  background: #1e40af;
}

/* Header - Sticky with Grid Layout */
.header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto auto;
  gap: 0.5rem 2rem;
  grid-template-areas:
    'back-link actions'
    'title-and-badges actions'
    'stats actions';
}
.back-link {
  grid-area: back-link;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #123157;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #1e40af;
}

.training-info {
  display: contents;
}

.training-title {
  grid-area: title-and-badges;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.training-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #123157;
  margin: 0;
}

.training-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.past {
  background: #f3f4f6;
  color: #6b7280;
}

.status-badge.today {
  background: #d4edda;
  color: #155724;
}

.status-badge.soon {
  background: #fff3cd;
  color: #856404;
}

.status-badge.published {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.draft {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.unsaved {
  background: #fef3c7;
  color: #92400e;
  animation: pulse-orange 2s ease-in-out infinite;
}

@keyframes pulse-orange {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.training-stats {
  grid-area: stats;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #123157;
}

.header-actions {
  grid-area: actions;
  display: flex;
  gap: 1rem;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  min-height: 120px; /* Reserve minimum space for actions */
}

.btn-publish,
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-publish {
  background: #10b981;
  color: white;
}

.btn-publish:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #ccc;
}

.btn-publish:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Lineup Section */
.lineup-section {
  padding: 2rem 0;
}

.section-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.lineup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.lineup-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #123157;
  margin: 0;
}

.lineup-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.lineup-stats .stat {
  color: #666;
  font-weight: 500;
}

.btn-clear {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-clear:hover:not(:disabled) {
  background: #c82333;
}

.btn-clear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.instructions {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #0ea5e9;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #0c4a6e;
}

.instructions strong {
  color: #0369a1;
}

/* Unsaved Changes Warning */
.unsaved-warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #92400e;
}

.warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.warning-content p {
  margin: 0;
}

.warning-content p:first-child {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

/* Enhanced Lineup Interface */
.lineup-interface {
  display: flex;
  gap: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 600px;
}

.members-panel {
  flex: 0 0 350px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.boat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #123157;
}

.members-count {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.boat-legend {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 300px;
  font-size: 0.9rem;
}

.legend-item {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
}

.legend-item.port {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.legend-item.starboard {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

/* Members Panel */
.members-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.available-members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  width: 100%;
}

.member-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  cursor: grab;
  position: relative;
}

.member-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

.member-card.dragging {
  opacity: 0.5;
  transform: rotate(3deg) scale(0.95);
}

.member-card:active {
  cursor: grabbing;
}

.member-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initial {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #123157, #1e40af);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #123157;
  margin: 0 0 0.25rem 0;
}

.member-role {
  color: #6b7280;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
}

.member-stats {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.stat-item {
  color: #64748b;
  padding: 0.15rem 0.4rem;
  background: #f1f5f9;
  border-radius: 6px;
}

.stat-item.preferred-side {
  font-weight: 600;
}

.stat-item.side-l {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
}

.stat-item.side-r {
  color: #16a34a;
  background: rgba(34, 197, 94, 0.1);
}

.drag-handle {
  color: #9ca3af;
  font-size: 1.1rem;
  cursor: grab;
  user-select: none;
}

.no-available-members {
  text-align: center;
  padding: 2rem 1rem;
  color: #666;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* Assigned Members Summary */
.assigned-summary {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.assigned-summary h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #123157;
  margin-bottom: 0.75rem;
}

.assigned-chips {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assigned-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.assigned-chip:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.chip-name {
  flex: 1;
  font-weight: 500;
}

.chip-position {
  background: #3b82f6;
  color: white;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.7rem;
}

/* Enhanced Dragon Boat */
.dragon-boat-container {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: all 0.3s ease;
}

.dragon-boat-container.drop-active {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.dragon-boat-enhanced {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 500px;
}

.dragon-head-section,
.drummer-section {
  text-align: center;
}

.dragon-head {
  font-size: 2rem;
}

.head-label,
.drummer-label {
  font-weight: 600;
  color: #123157;
  font-size: 0.9rem;
}

.drummer-seat {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.boat-body-section {
  flex: 1;
  width: 100%;
}

.seat-rows {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.seat-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: center;
}

.row-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #123157;
  font-size: 0.9rem;
  border: 2px solid #e2e8f0;
}

.boat-seat {
  background: white;
  border: 3px solid #e2e8f0;
  border-radius: 16px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.boat-seat.port-seat {
  border-left: 4px solid #ef4444;
}

.boat-seat.starboard-seat {
  border-right: 4px solid #22c55e;
}

.boat-seat.drop-target {
  border-color: #10b981;
  background: #f0fdf4;
}

.boat-seat.drag-over {
  border-color: #059669;
  background: #dcfce7;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.boat-seat.occupied {
  border-color: #3b82f6;
  background: #eff6ff;
}

.boat-seat.highlighted {
  border-color: #f59e0b;
  background: #fffbeb;
  animation: pulse 1s ease-in-out 2;
}

.boat-seat.local-change {
  border-color: #f59e0b;
  background: #fef3c7;
  position: relative;
}

.boat-seat.local-change::before {
  content: '';
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse-orange 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.seat-person {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  width: 100%;
  cursor: grab;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.seat-person:hover {
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.seat-person.dragging {
  opacity: 0.6;
  transform: rotate(2deg) scale(0.95);
  cursor: grabbing;
}

.seat-person:active {
  cursor: grabbing;
}

.person-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #123157, #1e40af);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.person-details {
  flex: 1;
}

.person-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.seat-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  border: 2px solid white;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-weight: 700;
}

.remove-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.empty-seat {
  text-align: center;
  color: #9ca3af;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.seat-number {
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
  color: #6b7280;
}

.seat-hint {
  font-size: 0.75rem;
  opacity: 0.8;
  color: #9ca3af;
}

.drop-zone {
  position: absolute;
  inset: 4px;
  border: 2px dashed transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.boat-seat.drop-target .drop-zone {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.boat-seat.drag-over .drop-zone {
  border-color: #059669;
  background: rgba(5, 150, 105, 0.2);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .lineup-interface {
    flex-direction: column;
  }

  .members-panel {
    flex: 0 0 auto;
    max-height: 300px;
  }

  .boat-panel {
    flex: 1;
    min-height: 500px;
  }

  .members-scroll {
    max-height: 200px;
  }

  .available-members-list {
    flex-direction: row;
    overflow-x: auto;
    gap: 1rem;
    padding-bottom: 0.5rem;
  }

  .member-card {
    min-width: 250px;
    flex-shrink: 0;
  }

  .assigned-chips {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .header-actions {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .header-content {
    grid-template-columns: 1fr;
    grid-template-areas:
      'back-link'
      'title-and-badges'
      'stats'
      'actions';
    gap: 1.5rem;
  }

  .header-actions {
    justify-content: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    min-height: auto;
  }

  .training-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .training-stats {
    gap: 1rem;
  }

  .lineup-interface {
    gap: 1rem;
    border-radius: 12px;
  }

  .panel-header {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .boat-legend {
    flex-direction: column;
    gap: 0.5rem;
  }

  .seat-row {
    gap: 0.5rem;
  }

  .boat-seat {
    min-height: 70px;
  }

  .row-number {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .person-name {
    font-size: 0.8rem;
  }

  .seat-number {
    font-size: 1rem;
  }

  .dragon-head,
  .drummer-seat {
    font-size: 2rem;
  }
}
</style>
