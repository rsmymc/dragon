<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { usePersonsStore } from '@/stores/persons'
import { PERSON_SIDE_KEYS } from '@/constants'
import styles from '@/assets/styles/profile.module.css'

const authStore = useAuthStore()
const personsStore = usePersonsStore()
const { t } = useI18n()

const isLoading = ref(true)
const loadError = ref('')
const isSubmitting = ref(false)
const submitError = ref('')
const justSaved = ref(false)

const person = ref(null)

const form = reactive({
  name: '',
  phone: '',
  height: '',
  weight: '',
  side: '',
})

const errors = reactive({
  name: '',
  phone: '',
  height: '',
  weight: '',
})

// '' / undefined -> null; numbers preserved (0 stays 0)
const norm = (v) => (v === '' || v === undefined ? null : v)

const loadProfile = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const personId = authStore.myPersonId
    if (!personId) {
      loadError.value = t('profile.noProfile')
      return
    }

    const p = await personsStore.fetchPerson(personId)
    person.value = p
    form.name = p.name ?? ''
    form.phone = p.phone ?? ''
    form.height = p.height ?? ''
    form.weight = p.weight ?? ''
    form.side = p.side ?? ''
  } catch (error) {
    console.error('Failed to load profile:', error)
    loadError.value = t('profile.loadFailed')
  } finally {
    isLoading.value = false
  }
}

const validate = () => {
  errors.name = ''
  errors.phone = ''
  errors.height = ''
  errors.weight = ''
  let ok = true

  if (!form.name.trim()) {
    errors.name = t('personForm.nameRequired')
    ok = false
  }
  if (form.phone && !/^[+]?[\d\s\-()]+$/.test(form.phone)) {
    errors.phone = t('personForm.phoneInvalid')
    ok = false
  }
  if (form.height && (form.height < 100 || form.height > 250)) {
    errors.height = t('personForm.heightRange')
    ok = false
  }
  if (form.weight && (form.weight < 30 || form.weight > 200)) {
    errors.weight = t('personForm.weightRange')
    ok = false
  }

  return ok
}

const isValid = computed(() => {
  return (
    form.name.trim().length > 0 && !errors.name && !errors.phone && !errors.height && !errors.weight
  )
})

const handleSubmit = async () => {
  justSaved.value = false
  if (!validate() || isSubmitting.value || !person.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const candidate = {
      name: form.name.trim(),
      phone: norm(typeof form.phone === 'string' ? form.phone.trim() : form.phone),
      height: norm(form.height),
      weight: norm(form.weight),
      side: norm(form.side),
    }

    // Only send fields that actually changed
    const changes = {}
    for (const key of Object.keys(candidate)) {
      if (candidate[key] !== norm(person.value[key])) {
        changes[key] = candidate[key]
      }
    }

    if (Object.keys(changes).length === 0) {
      justSaved.value = true
      return
    }

    const result = await personsStore.updatePerson(person.value.id, changes)
    if (result && result.success === false) {
      throw new Error(result.error || t('profile.saveFailed'))
    }

    person.value = { ...person.value, ...changes }
    justSaved.value = true
  } catch (error) {
    console.error('Failed to update profile:', error)
    submitError.value = error.message || t('profile.saveFailedRetry')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div :class="styles.editPersonView">
    <div :class="styles.header">
      <h1 :class="styles.title">{{ t('profile.title') }}</h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" :class="styles.loading">
      <div :class="styles.spinner"></div>
      <p>{{ t('profile.loading') }}</p>
    </div>

    <!-- Load error -->
    <div v-else-if="loadError" :class="styles.errorContainer">
      <div :class="styles.errorMessage">
        <h3>{{ t('profile.loadErrorTitle') }}</h3>
        <p>{{ loadError }}</p>
        <button @click="loadProfile" :class="styles.retryBtn">{{ t('common.tryAgain') }}</button>
      </div>
    </div>

    <!-- Form -->
    <div v-else :class="styles.formContainer">
      <form @submit.prevent="handleSubmit" :class="styles.editForm">
        <div :class="styles.formGroup">
          <label for="name" :class="styles.formLabel">
            {{ t('personForm.name') }} <span :class="styles.required">*</span>
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            :class="[styles.formInput, { [styles.error]: errors.name }]"
            :placeholder="t('profile.namePlaceholder')"
            :disabled="isSubmitting"
          />
          <span v-if="errors.name" :class="styles.fieldError">{{ errors.name }}</span>
        </div>

        <div :class="styles.formGroup">
          <label for="phone" :class="styles.formLabel">{{ t('personForm.phone') }}</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            :class="[styles.formInput, { [styles.error]: errors.phone }]"
            :placeholder="t('profile.phonePlaceholder')"
            :disabled="isSubmitting"
          />
          <span v-if="errors.phone" :class="styles.fieldError">{{ errors.phone }}</span>
        </div>

        <div :class="styles.formRow">
          <div :class="styles.formGroup">
            <label for="height" :class="styles.formLabel">{{ t('personForm.height') }}</label>
            <input
              id="height"
              v-model="form.height"
              type="number"
              :class="[styles.formInput, { [styles.error]: errors.height }]"
              :placeholder="t('profile.heightPlaceholder')"
              min="100"
              max="250"
              :disabled="isSubmitting"
            />
            <span v-if="errors.height" :class="styles.fieldError">{{ errors.height }}</span>
          </div>

          <div :class="styles.formGroup">
            <label for="weight" :class="styles.formLabel">{{ t('personForm.weight') }}</label>
            <input
              id="weight"
              v-model="form.weight"
              type="number"
              :class="[styles.formInput, { [styles.error]: errors.weight }]"
              :placeholder="t('profile.weightPlaceholder')"
              min="30"
              max="200"
              :disabled="isSubmitting"
            />
            <span v-if="errors.weight" :class="styles.fieldError">{{ errors.weight }}</span>
          </div>
        </div>

        <div :class="styles.formGroup">
          <label for="side" :class="styles.formLabel">{{ t('profile.preferredSide') }}</label>
          <select id="side" v-model="form.side" :class="styles.formInput" :disabled="isSubmitting">
            <option v-for="(key, value) in PERSON_SIDE_KEYS" :key="value" :value="Number(value)">
              {{ t(`sides.${key}`) }}
            </option>
          </select>
        </div>

        <!-- Submit feedback -->
        <div v-if="submitError" :class="styles.errorMessage">{{ submitError }}</div>

        <div :class="styles.formActions">
          <span
            v-if="justSaved"
            style="
              margin-right: auto;
              align-self: center;
              color: var(--color-success);
              font-weight: 600;
            "
          >
            {{ t('profile.saved') }} ✓
          </span>
          <button type="submit" :class="styles.saveBtn" :disabled="isSubmitting || !isValid">
            <span v-if="isSubmitting" :class="styles.btnLoading">
              <span :class="styles.btnSpinner"></span>
              {{ t('profile.saving') }}
            </span>
            <span v-else>{{ t('profile.saveChanges') }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
