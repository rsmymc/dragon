<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { register } from '@/services/auth'
import styles from '@/assets/styles/login.module.css'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

// Form data
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const email = ref('')
const phone = ref('')

// UI state
const loading = ref(false)
const showPassword = ref(false)

// Validation errors
const errors = ref({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: '',
  phone: '',
  general: '',
})

// Computed properties (required fields only)
const isFormValid = computed(() => {
  return (
    username.value.trim() &&
    password.value.length >= 6 &&
    confirmPassword.value === password.value &&
    name.value.trim() &&
    !loading.value
  )
})

// Validation functions
function validateUsername() {
  const value = username.value.trim()
  if (!value) {
    errors.value.username = t('register.usernameRequired')
    return false
  }
  if (value.length < 3) {
    errors.value.username = t('register.usernameMinLength')
    return false
  }
  if (/\s/.test(value)) {
    errors.value.username = t('register.usernameNoSpaces')
    return false
  }
  errors.value.username = ''
  return true
}

function validatePassword() {
  if (!password.value) {
    errors.value.password = t('register.passwordRequired')
    return false
  }
  if (password.value.length < 6) {
    errors.value.password = t('register.passwordMinLength')
    return false
  }
  errors.value.password = ''
  return true
}

function validateConfirmPassword() {
  if (!confirmPassword.value) {
    errors.value.confirmPassword = t('register.confirmPasswordRequired')
    return false
  }
  if (confirmPassword.value !== password.value) {
    errors.value.confirmPassword = t('register.passwordsDoNotMatch')
    return false
  }
  errors.value.confirmPassword = ''
  return true
}

function validateName() {
  if (!name.value.trim()) {
    errors.value.name = t('register.nameRequired')
    return false
  }
  errors.value.name = ''
  return true
}

// Optional fields: only validated if a value is present
function validateEmail() {
  const value = email.value.trim()
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.value.email = t('register.emailInvalid')
    return false
  }
  errors.value.email = ''
  return true
}

function validatePhone() {
  const value = phone.value.trim()
  if (value && !/^[+\d][\d\s()-]{5,}$/.test(value)) {
    errors.value.phone = t('register.phoneInvalid')
    return false
  }
  errors.value.phone = ''
  return true
}

function validateForm() {
  const checks = [
    validateName(),
    validateUsername(),
    validatePassword(),
    validateConfirmPassword(),
    validateEmail(),
    validatePhone(),
  ]
  return checks.every(Boolean)
}

// Clear errors when user starts typing
function clearError(field) {
  errors.value[field] = ''
  errors.value.general = ''
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

// Map DRF serializer 400 errors back onto the matching fields
function applyServerErrors(data) {
  if (!data || typeof data !== 'object') return false
  let matched = false
  for (const field of ['username', 'password', 'name', 'email', 'phone']) {
    if (data[field]) {
      const msg = Array.isArray(data[field]) ? data[field][0] : data[field]
      errors.value[field] = msg
      matched = true
    }
  }
  if (data.detail) {
    errors.value.general = Array.isArray(data.detail) ? data.detail[0] : data.detail
    matched = true
  }
  return matched
}

async function onSubmit() {
  if (!validateForm()) return

  loading.value = true
  errors.value.general = ''

  // Build payload: omit optional fields when empty (don't send '')
  const payload = {
    username: username.value.trim(),
    password: password.value,
    name: name.value.trim(),
  }
  const emailValue = email.value.trim()
  const phoneValue = phone.value.trim()
  if (emailValue) payload.email = emailValue
  if (phoneValue) payload.phone = phoneValue

  try {
    // Endpoint returns { access, refresh, user, person } -> auto-login
    const data = await register(payload)
    auth.setTokens(data, false, username.value.trim())

    await router.push('/teams')
  } catch (e) {
    console.error('Register error:', e)

    if (e.response?.status === 400) {
      const matched = applyServerErrors(e.response.data)
      if (!matched) {
        errors.value.general = t('register.registrationFailed')
      }
    } else if (e.response?.status === 429) {
      errors.value.general = t('register.tooManyAttempts')
    } else if (e.response?.data?.message) {
      errors.value.general = e.response.data.message
    } else {
      errors.value.general = t('register.connectionFailed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div :class="styles.loginPage">
    <div :class="styles.loginCard">
      <!-- Dragon Boat Themed Header -->
      <div :class="styles.loginHeader">
        <div :class="styles.appLogo">
          <img alt="DragonBoat Logo" src="../assets/images/logo.png" width="128" height="128" />
          <h1 :class="styles.appTitle">DragonBoat Manager</h1>
        </div>
      </div>

      <form @submit.prevent="onSubmit" :class="styles.loginForm">
        <!-- Name Field -->
        <div :class="styles.formGroup">
          <label for="name">{{ t('register.name') }}</label>
          <div :class="styles.inputContainer">
            <input
              id="name"
              v-model="name"
              @input="clearError('name')"
              @blur="validateName"
              type="text"
              autocomplete="name"
              required
              :class="{ [styles.error]: errors.name }"
              :placeholder="t('register.namePlaceholder')"
            />
            <div v-if="name && !errors.name" :class="styles.inputSuccess">
              <svg
                :class="styles.successIcon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          </div>
          <p v-if="errors.name" :class="styles.errorMessage">{{ errors.name }}</p>
        </div>

        <!-- Username Field -->
        <div :class="styles.formGroup">
          <label for="username">{{ t('register.username') }}</label>
          <div :class="styles.inputContainer">
            <input
              id="username"
              v-model="username"
              @input="clearError('username')"
              @blur="validateUsername"
              type="text"
              autocomplete="username"
              required
              :class="{ [styles.error]: errors.username }"
              :placeholder="t('register.usernamePlaceholder')"
            />
            <div v-if="username && !errors.username" :class="styles.inputSuccess">
              <svg
                :class="styles.successIcon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          </div>
          <p v-if="errors.username" :class="styles.errorMessage">{{ errors.username }}</p>
        </div>

        <!-- Password Field -->
        <div :class="styles.formGroup">
          <label for="password">{{ t('register.password') }}</label>
          <div :class="styles.inputContainer">
            <input
              id="password"
              v-model="password"
              @input="clearError('password')"
              @blur="validatePassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              :class="{ [styles.error]: errors.password }"
              :placeholder="t('register.passwordPlaceholder')"
            />
            <button type="button" @click="togglePasswordVisibility" :class="styles.passwordToggle">
              <svg
                v-if="showPassword"
                :class="styles.toggleIcon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                ></path>
              </svg>
              <svg
                v-else
                :class="styles.toggleIcon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                ></path>
              </svg>
            </button>
          </div>
          <p v-if="errors.password" :class="styles.errorMessage">{{ errors.password }}</p>
        </div>

        <!-- Confirm Password Field -->
        <div :class="styles.formGroup">
          <label for="confirmPassword">{{ t('register.confirmPassword') }}</label>
          <div :class="styles.inputContainer">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              @input="clearError('confirmPassword')"
              @blur="validateConfirmPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              required
              :class="{ [styles.error]: errors.confirmPassword }"
              :placeholder="t('register.confirmPasswordPlaceholder')"
            />
          </div>
          <p v-if="errors.confirmPassword" :class="styles.errorMessage">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <!-- Email Field (optional) -->
        <div :class="styles.formGroup">
          <label for="email"
            >{{ t('register.email') }}
            <span :class="styles.optionalTag">{{ t('common.optional') }}</span></label
          >
          <div :class="styles.inputContainer">
            <input
              id="email"
              v-model="email"
              @input="clearError('email')"
              @blur="validateEmail"
              type="email"
              autocomplete="email"
              :class="{ [styles.error]: errors.email }"
              :placeholder="t('register.emailPlaceholder')"
            />
          </div>
          <p v-if="errors.email" :class="styles.errorMessage">{{ errors.email }}</p>
        </div>

        <!-- Phone Field (optional) -->
        <div :class="styles.formGroup">
          <label for="phone"
            >{{ t('register.phone') }}
            <span :class="styles.optionalTag">{{ t('common.optional') }}</span></label
          >
          <div :class="styles.inputContainer">
            <input
              id="phone"
              v-model="phone"
              @input="clearError('phone')"
              @blur="validatePhone"
              type="tel"
              autocomplete="tel"
              :class="{ [styles.error]: errors.phone }"
              :placeholder="t('register.phonePlaceholder')"
            />
          </div>
          <p v-if="errors.phone" :class="styles.errorMessage">{{ errors.phone }}</p>
        </div>

        <!-- General Error -->
        <div v-if="errors.general" :class="styles.generalError">
          <svg :class="styles.errorIcon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{{ errors.general }}</span>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="!isFormValid"
          :class="[styles.loginButton, { [styles.loading]: loading }]"
        >
          <svg v-if="loading" :class="styles.loadingSpinner" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{{ loading ? t('register.submitting') : t('register.submit') }}</span>
        </button>
      </form>

      <!-- Sign in link -->
      <div :class="styles.loginFooter">
        <p>
          {{ t('register.haveAccount') }}
          <RouterLink to="/login">{{ t('register.signIn') }}</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
