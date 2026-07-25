<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePersonsStore } from '@/stores/persons.js'
import { useMembershipStore } from '@/stores/membership.js'
import {
  MEMBERSHIP_ROLE_LABELS,
  PERSON_SIDE_LABELS,
  DEFAULT_FORM_VALUES,
  MEMBERSHIP_ROLES,
  PERSON_SIDES,
} from '@/constants.js'
import styles from '@/assets/styles/add-person-to-team.module.css'

// Props
const props = defineProps({
  teamId: {
    type: String,
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
})

// Emits
const emit = defineEmits(['close', 'success'])

// Stores
const personsStore = usePersonsStore()
const membershipStore = useMembershipStore()

// Form data
const personForm = ref({ ...DEFAULT_FORM_VALUES.PERSON })
const membershipForm = ref({ ...DEFAULT_FORM_VALUES.MEMBERSHIP })

// Loading and error states
const isSubmitting = ref(false)
const formErrors = ref({})

// Computed
const isFormValid = computed(() => {
  return (
    personForm.value.name.trim().length > 0 && !formErrors.value.name && !formErrors.value.phone
  )
})

// Methods
const validateForm = () => {
  formErrors.value = {}

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

  return Object.keys(formErrors.value).length === 0
}

const submitForm = async () => {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    // Step 1: Create the person
    const personResult = await personsStore.createPerson(personForm.value)
    if (!personResult.success) {
      alert(`Failed to create person: ${personResult.error}`)
      return
    }

    // Step 2: Add them to the team
    const result = await membershipStore.createMembership({
      person: personResult.person.id,
      team: props.teamId,
      role: membershipForm.value.role,
    })

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

// Lifecycle
onMounted(() => {
  // Focus the first input when the modal opens
  setTimeout(() => {
    const firstInput = document.querySelector(`.${styles.modalContent} input`)
    if (firstInput) firstInput.focus()
  }, 100)
})
</script>

<template>
  <div :class="styles.modalOverlay" @click="closeModal">
    <div :class="styles.modalContent" @click.stop>
      <!-- Modal Header -->
      <div :class="styles.modalHeader">
        <h2>Add Person to {{ teamName }}</h2>
        <button @click="closeModal" :class="styles.closeBtn" aria-label="Close">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Modal Body -->
      <div :class="styles.modalBody">
        <form @submit.prevent="submitForm">
          <!-- Person Details -->
          <div :class="styles.formSection">
            <h3>Person Details</h3>

            <!-- Name -->
            <div :class="styles.formGroup">
              <label for="name">Name <span :class="styles.required">*</span></label>
              <input
                id="name"
                v-model="personForm.name"
                type="text"
                :class="[styles.formInput, { [styles.error]: formErrors.name }]"
                placeholder="Enter full name"
                required
              />
              <span v-if="formErrors.name" :class="styles.errorMessage">{{ formErrors.name }}</span>
            </div>

            <!-- Phone -->
            <div :class="styles.formGroup">
              <label for="phone">Phone</label>
              <input
                id="phone"
                v-model="personForm.phone"
                type="tel"
                :class="[styles.formInput, { [styles.error]: formErrors.phone }]"
                placeholder="Enter phone number"
              />
              <span v-if="formErrors.phone" :class="styles.errorMessage">{{
                formErrors.phone
              }}</span>
            </div>

            <!-- Height and Weight -->
            <div :class="styles.formRow">
              <div :class="styles.formGroup">
                <label for="height">Height (cm)</label>
                <input
                  id="height"
                  v-model="personForm.height"
                  type="number"
                  :class="[styles.formInput, { [styles.error]: formErrors.height }]"
                  placeholder="170"
                  min="100"
                  max="250"
                />
                <span v-if="formErrors.height" :class="styles.errorMessage">{{
                  formErrors.height
                }}</span>
              </div>

              <div :class="styles.formGroup">
                <label for="weight">Weight (kg)</label>
                <input
                  id="weight"
                  v-model="personForm.weight"
                  type="number"
                  :class="[styles.formInput, { [styles.error]: formErrors.weight }]"
                  placeholder="70"
                  min="30"
                  max="200"
                />
                <span v-if="formErrors.weight" :class="styles.errorMessage">{{
                  formErrors.weight
                }}</span>
              </div>
            </div>

            <!-- Side Preference -->
            <div :class="styles.formGroup">
              <label for="side">Side Preference</label>
              <select id="side" v-model="personForm.side" :class="styles.formSelect">
                <option :value="PERSON_SIDES.BOTH">
                  {{ PERSON_SIDE_LABELS[PERSON_SIDES.BOTH] }}
                </option>
                <option :value="PERSON_SIDES.LEFT">
                  {{ PERSON_SIDE_LABELS[PERSON_SIDES.LEFT] }}
                </option>
                <option :value="PERSON_SIDES.RIGHT">
                  {{ PERSON_SIDE_LABELS[PERSON_SIDES.RIGHT] }}
                </option>
              </select>
            </div>
          </div>

          <!-- Membership Details -->
          <div :class="styles.formSection">
            <h3>Membership Details</h3>

            <!-- Role -->
            <div :class="styles.formGroup">
              <label for="role">Role</label>
              <select id="role" v-model="membershipForm.role" :class="styles.formSelect">
                <option :value="MEMBERSHIP_ROLES.PLAYER">
                  {{ MEMBERSHIP_ROLE_LABELS[MEMBERSHIP_ROLES.PLAYER] }}
                </option>
                <option :value="MEMBERSHIP_ROLES.CAPTAIN">
                  {{ MEMBERSHIP_ROLE_LABELS[MEMBERSHIP_ROLES.CAPTAIN] }}
                </option>
                <option :value="MEMBERSHIP_ROLES.COACH">
                  {{ MEMBERSHIP_ROLE_LABELS[MEMBERSHIP_ROLES.COACH] }}
                </option>
                <option :value="MEMBERSHIP_ROLES.MANAGER">
                  {{ MEMBERSHIP_ROLE_LABELS[MEMBERSHIP_ROLES.MANAGER] }}
                </option>
              </select>
            </div>
          </div>
        </form>
      </div>

      <!-- Modal Footer -->
      <div :class="styles.modalFooter">
        <button @click="closeModal" :class="styles.btnSecondary">Cancel</button>
        <button
          @click="submitForm"
          :disabled="!isFormValid || isSubmitting"
          :class="styles.btnPrimary"
        >
          <span v-if="isSubmitting">Adding...</span>
          <span v-else>Add to Team</span>
        </button>
      </div>
    </div>
  </div>
</template>
