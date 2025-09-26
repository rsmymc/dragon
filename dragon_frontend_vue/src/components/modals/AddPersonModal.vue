<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePersonsStore } from '@/stores/persons.js'
import { useMembershipStore } from '@/stores/membership.js'
import {
  MEMBERSHIP_ROLE_LABELS,
  PERSON_SIDE_LABELS,
  DEFAULT_FORM_VALUES,
  MEMBERSHIP_ROLES,
  PERSON_SIDES
} from '@/constants.js'
import '@/assets/styles/add-person-to-team.css';


// Props
const props = defineProps({
  teamId: {
    type: String,
    required: true
  },
  teamName: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Stores
const personsStore = usePersonsStore()
const membershipStore = useMembershipStore()

// Form mode - 'create' for new person, 'existing' for existing person
const mode = ref('create')

// Form data
const personForm = ref({ ...DEFAULT_FORM_VALUES.PERSON })
const membershipForm = ref({ ...DEFAULT_FORM_VALUES.MEMBERSHIP })

// Existing person selection
const selectedPersonId = ref('')
const searchQuery = ref('')
const availablePersons = ref([])

// Loading and error states
const isSubmitting = ref(false)
const formErrors = ref({})

// Computed
const isFormValid = computed(() => {
  if (mode.value === 'create') {
    return personForm.value.name.trim().length > 0 &&
      !formErrors.value.name &&
      !formErrors.value.phone
  } else {
    return selectedPersonId.value !== ''
  }
})

const filteredPersons = computed(() => {
  if (!searchQuery.value) return availablePersons.value

  const query = searchQuery.value.toLowerCase()
  return availablePersons.value.filter(person =>
    person.name.toLowerCase().includes(query) ||
    (person.phone && person.phone.includes(query))
  )
})

// Methods
const validateForm = () => {
  formErrors.value = {}

  if (mode.value === 'create') {
    // Validate name
    if (!personForm.value.name.trim()) {
      formErrors.value.name = 'Name is required'
    }

    // Validate phone (if provided)
    if (personForm.value.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(personForm.value.phone)) {
      formErrors.value.phone = 'Please enter a valid phone number'
    }

    // Validate height (if provided)
    if (personForm.value.height && (personForm.value.height < 100 || personForm.value.height > 250)) {
      formErrors.value.height = 'Height should be between 100-250 cm'
    }

    // Validate weight (if provided)
    if (personForm.value.weight && (personForm.value.weight < 30 || personForm.value.weight > 200)) {
      formErrors.value.weight = 'Weight should be between 30-200 kg'
    }
  }

  return Object.keys(formErrors.value).length === 0
}

const submitForm = async () => {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    let result

    if (mode.value === 'create') {
      // Step 1: Create person via persons store
      const personResult = await personsStore.createPerson(personForm.value)
      if (!personResult.success) {
        alert(`Failed to create person: ${personResult.error}`)
        return
      }

      // Step 2: Create membership via membership store
      result = await membershipStore.createMembership({
        person: personResult.person.id,
        team: props.teamId,
        role: membershipForm.value.role
      })
    } else {
      // Add existing person to team via membership store
      result = await membershipStore.createMembership({
        person: selectedPersonId.value,
        team: props.teamId,
        role: membershipForm.value.role
      })
    }

    if (result.success) {
      emit('success', result.membership)
    } else {
      alert(`Failed to add person to team: ${result.error}`)
    }

  } catch (error) {
    console.error('Add person error:', error)
    alert('An unexpected error occurred while adding the person.')
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  emit('close')
}

const switchMode = (newMode) => {
  mode.value = newMode
  formErrors.value = {}

  if (newMode === 'existing') {
    loadAvailablePersons()
  }
}

const loadAvailablePersons = async () => {
  try {
    // Load all persons via persons store
    await personsStore.fetchPersons()

    // Filter persons who are not already on this team
    const currentTeamMemberIds = membershipStore.teamMemberships.map(m => m.person.id)

    availablePersons.value = personsStore.persons.filter(person =>
      !currentTeamMemberIds.includes(person.id)
    )
  } catch (error) {
    console.error('Failed to load available persons:', error)
  }
}

// Lifecycle
onMounted(() => {
  console.log('Modal mounted with Team ID:', props.teamId)
  console.log('Modal mounted with Team Name:', props.teamName)

  // Focus on first input when modal opens
  setTimeout(() => {
    const firstInput = document.querySelector('.modal-content input')
    if (firstInput) firstInput.focus()
  }, 100)
})
</script>

<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>Add Person to {{ teamName }}</h2>
        <button @click="closeModal" class="close-btn">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mode Selection -->
      <div class="mode-selection">
        <div class="mode-tabs">
          <button
            @click="switchMode('create')"
            :class="{ active: mode === 'create' }"
            class="mode-tab"
          >
            Create New Person
          </button>
          <button
            @click="switchMode('existing')"
            :class="{ active: mode === 'existing' }"
            class="mode-tab"
          >
            Add Existing Person
          </button>
        </div>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <form @submit.prevent="submitForm">

          <!-- Create New Person Mode -->
          <div v-if="mode === 'create'" class="form-section">
            <h3>Person Details</h3>

            <!-- Name -->
            <div class="form-group">
              <label for="name">Name *</label>
              <input
                id="name"
                v-model="personForm.name"
                type="text"
                class="form-input"
                :class="{ error: formErrors.name }"
                placeholder="Enter full name"
                required
              />
              <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>
            </div>

            <!-- Phone -->
            <div class="form-group">
              <label for="phone">Phone</label>
              <input
                id="phone"
                v-model="personForm.phone"
                type="tel"
                class="form-input"
                :class="{ error: formErrors.phone }"
                placeholder="Enter phone number"
              />
              <span v-if="formErrors.phone" class="error-message">{{ formErrors.phone }}</span>
            </div>

            <!-- Height and Weight -->
            <div class="form-row">
              <div class="form-group">
                <label for="height">Height (cm)</label>
                <input
                  id="height"
                  v-model="personForm.height"
                  type="number"
                  class="form-input"
                  :class="{ error: formErrors.height }"
                  placeholder="170"
                  min="100"
                  max="250"
                />
                <span v-if="formErrors.height" class="error-message">{{ formErrors.height }}</span>
              </div>

              <div class="form-group">
                <label for="weight">Weight (kg)</label>
                <input
                  id="weight"
                  v-model="personForm.weight"
                  type="number"
                  class="form-input"
                  :class="{ error: formErrors.weight }"
                  placeholder="70"
                  min="30"
                  max="200"
                />
                <span v-if="formErrors.weight" class="error-message">{{ formErrors.weight }}</span>
              </div>
            </div>

            <!-- Side Preference -->
            <div class="form-group">
              <label for="side">Side Preference</label>
              <select id="side" v-model="personForm.side" class="form-select">
                <option :value="PERSON_SIDES.BOTH">{{ PERSON_SIDE_LABELS[PERSON_SIDES.BOTH] }}</option>
                <option :value="PERSON_SIDES.LEFT">{{ PERSON_SIDE_LABELS[PERSON_SIDES.LEFT] }}</option>
                <option :value="PERSON_SIDES.RIGHT">{{ PERSON_SIDE_LABELS[PERSON_SIDES.RIGHT] }}</option>
              </select>
            </div>
          </div>

          <!-- Add Existing Person Mode -->
          <div v-else class="form-section">
            <h3>Select Person</h3>

            <!-- Search -->
            <div class="form-group">
              <label for="search">Search People</label>
              <input
                id="search"
                v-model="searchQuery"
                type="text"
                class="form-input"
                placeholder="Search by name or phone..."
              />
            </div>

            <!-- Person Selection -->
            <div class="person-selection">
              <div v-if="personsStore.isLoading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading available people...</p>
              </div>

              <div v-else-if="filteredPersons.length === 0" class="empty-state">
                <p>{{ searchQuery ? 'No people found matching your search.' : 'No available people to add.' }}</p>
              </div>

              <div v-else class="person-list">
                <div
                  v-for="person in filteredPersons"
                  :key="person.id"
                  class="person-item"
                  :class="{ selected: selectedPersonId == person.id }"
                  @click="selectedPersonId = person.id"
                >
                  <div class="person-avatar">
                    <img
                      v-if="person.profile_picture_url"
                      :src="person.profile_picture_url"
                      :alt="person.name"
                      class="avatar-image"
                    />
                    <div v-else class="avatar-initial">
                      {{ person.name.charAt(0) }}
                    </div>
                  </div>

                  <div class="person-info">
                    <h4>{{ person.name }}</h4>
                    <p v-if="person.phone">📱 {{ person.phone }}</p>
                    <p v-if="person.height || person.weight">
                      <span v-if="person.height">📏 {{ person.height }}cm</span>
                      <span v-if="person.weight"> ⚖️ {{ person.weight }}kg</span>
                    </p>
                    <p>🧭 {{ PERSON_SIDE_LABELS[person.side] }}</p>
                  </div>

                  <div class="selection-indicator">
                    <svg v-if="selectedPersonId == person.id" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Membership Details -->
          <div class="form-section">
            <h3>Membership Details</h3>

            <!-- Role -->
            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" v-model="membershipForm.role" class="form-select">
                <option :value="MEMBERSHIP_ROLES.PLAYER">{{ MEMBERSHIP_ROLE_LABELS[MEMBERSHIP_ROLES.PLAYER] }}</option>
                <option :value="MEMBERSHIP_ROLES.CAPTAIN">{{ MEMBERSHIP_ROLE_LABELS[MEMBERSHIP_ROLES.CAPTAIN] }}</option>
                <option :value="MEMBERSHIP_ROLES.COACH">{{ MEMBERSHIP_ROLE_LABELS[MEMBERSHIP_ROLES.COACH] }}</option>
                <option :value="MEMBERSHIP_ROLES.MANAGER">{{ MEMBERSHIP_ROLE_LABELS[MEMBERSHIP_ROLES.MANAGER] }}</option>
              </select>
            </div>
          </div>

        </form>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button @click="closeModal" class="btn-secondary">Cancel</button>
        <button
          @click="submitForm"
          :disabled="!isFormValid || isSubmitting"
          class="btn-primary"
        >
          <span v-if="isSubmitting">Adding...</span>
          <span v-else>Add to Team</span>
        </button>
      </div>
    </div>
  </div>
</template>
