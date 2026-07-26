<script setup>
import { ref, reactive, computed } from 'vue'
import { usePersonsStore } from '@/stores/persons.js'
import { useMembershipStore } from '@/stores/membership.js'
import { MEMBERSHIP_ROLE_LABELS, PERSON_SIDE_LABELS, MEMBERSHIP_ROLES } from '@/constants.js'
import styles from '@/assets/styles/add-person-to-team.module.css'

// The full membership row (has .id, .role, and nested .person)
const props = defineProps({
  membership: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'success'])

const personsStore = usePersonsStore()
const membershipStore = useMembershipStore()

const isSubmitting = ref(false)
const submitError = ref('')
const formErrors = ref({})

const person = props.membership.person

// Person fields + team role, seeded from the current values
const form = reactive({
  name: person.name ?? '',
  phone: person.phone ?? '',
  height: person.height ?? '',
  weight: person.weight ?? '',
  side: person.side ?? '',
  role: props.membership.role,
})

const isFormValid = computed(() => {
  return form.name.trim().length > 0 && !formErrors.value.name && !formErrors.value.phone
})

// '' / undefined -> null; numbers preserved (0 stays 0)
const norm = (v) => (v === '' || v === undefined ? null : v)

const validateForm = () => {
  formErrors.value = {}

  if (!form.name.trim()) {
    formErrors.value.name = 'Name is required'
  }
  if (form.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(form.phone)) {
    formErrors.value.phone = 'Please enter a valid phone number'
  }
  if (form.height && (form.height < 100 || form.height > 250)) {
    formErrors.value.height = 'Height should be between 100-250 cm'
  }
  if (form.weight && (form.weight < 30 || form.weight > 200)) {
    formErrors.value.weight = 'Weight should be between 30-200 kg'
  }

  return Object.keys(formErrors.value).length === 0
}

const submitForm = async () => {
  if (!validateForm() || isSubmitting.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    // --- Person fields: send only what changed ---
    const candidate = {
      name: form.name.trim(),
      phone: norm(typeof form.phone === 'string' ? form.phone.trim() : form.phone),
      height: norm(form.height),
      weight: norm(form.weight),
      side: norm(form.side),
    }

    const personChanges = {}
    for (const key of Object.keys(candidate)) {
      if (candidate[key] !== norm(person[key])) {
        personChanges[key] = candidate[key]
      }
    }

    if (Object.keys(personChanges).length > 0) {
      const result = await personsStore.updatePerson(person.id, personChanges)
      if (result && result.success === false) {
        throw new Error(result.error || 'Failed to update person')
      }
    }

    // --- Team role: only if it changed (separate record: the membership) ---
    if (Number(form.role) !== Number(props.membership.role)) {
      await membershipStore.patchMembership(props.membership.id, { role: Number(form.role) })
    }

    emit('success')
  } catch (error) {
    console.error('Edit person error:', error)
    submitError.value = error.message || 'Failed to save changes. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  emit('close')
}
</script>

<template>
  <div :class="styles.modalOverlay" @click="closeModal">
    <div :class="styles.modalContent" @click.stop>
      <!-- Header -->
      <div :class="styles.modalHeader">
        <h2>Edit {{ person.name }}</h2>
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

      <!-- Body -->
      <div :class="styles.modalBody">
        <form @submit.prevent="submitForm">
          <!-- Person Details -->
          <div :class="styles.formSection">
            <h3>Person Details</h3>

            <div :class="styles.formGroup">
              <label for="name">Name <span :class="styles.required">*</span></label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                :class="[styles.formInput, { [styles.error]: formErrors.name }]"
                placeholder="Enter full name"
                required
              />
              <span v-if="formErrors.name" :class="styles.errorMessage">{{ formErrors.name }}</span>
            </div>

            <div :class="styles.formGroup">
              <label for="phone">Phone</label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                :class="[styles.formInput, { [styles.error]: formErrors.phone }]"
                placeholder="Enter phone number"
              />
              <span v-if="formErrors.phone" :class="styles.errorMessage">{{
                formErrors.phone
              }}</span>
            </div>

            <div :class="styles.formRow">
              <div :class="styles.formGroup">
                <label for="height">Height (cm)</label>
                <input
                  id="height"
                  v-model="form.height"
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
                  v-model="form.weight"
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

            <div :class="styles.formGroup">
              <label for="side">Side Preference</label>
              <select id="side" v-model="form.side" :class="styles.formSelect">
                <option value="" disabled>Select preferred side</option>
                <option
                  v-for="(label, value) in PERSON_SIDE_LABELS"
                  :key="value"
                  :value="Number(value)"
                >
                  {{ label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Team Role (membership - scoped to this team) -->
          <div :class="styles.formSection">
            <h3>Team Role</h3>
            <div :class="styles.formGroup">
              <label for="role">Role on this team</label>
              <select id="role" v-model="form.role" :class="styles.formSelect">
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

          <!-- Submit Error -->
          <div v-if="submitError" :class="styles.errorMessage">{{ submitError }}</div>
        </form>
      </div>

      <!-- Footer -->
      <div :class="styles.modalFooter">
        <button @click="closeModal" :class="styles.btnSecondary">Cancel</button>
        <button
          @click="submitForm"
          :disabled="!isFormValid || isSubmitting"
          :class="styles.btnPrimary"
        >
          <span v-if="isSubmitting">Saving...</span>
          <span v-else>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
</template>
