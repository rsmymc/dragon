<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/services/auth'
import styles from '@/assets/styles/login.module.css'

const router = useRouter()
const auth = useAuthStore()

// Form data
const username = ref('')
const password = ref('')
const rememberMe = ref(false)

// UI state
const loading = ref(false)
const showPassword = ref(false)

// Validation errors
const errors = ref({
  username: '',
  password: '',
  general: '',
})

// Computed properties
const isFormValid = computed(() => {
  return username.value.trim() && password.value.length >= 6 && !loading.value
})

// Validation functions
function validateUsername() {
  if (!username.value.trim()) {
    errors.value.username = 'Username is required'
    return false
  }
  if (username.value.length < 3) {
    errors.value.username = 'Username must be at least 3 characters'
    return false
  }
  errors.value.username = ''
  return true
}

function validatePassword() {
  if (!password.value) {
    errors.value.password = 'Password is required'
    return false
  }
  if (password.value.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
    return false
  }
  errors.value.password = ''
  return true
}

function validateForm() {
  const isUsernameValid = validateUsername()
  const isPasswordValid = validatePassword()
  return isUsernameValid && isPasswordValid
}

// Clear errors when user starts typing
function clearError(field) {
  errors.value[field] = ''
  errors.value.general = ''
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

async function onSubmit() {
  if (!validateForm()) return

  loading.value = true
  errors.value.general = ''

  try {
    const tokens = await login(username.value.trim(), password.value)
    auth.setTokens(tokens, rememberMe.value, username.value)

    // Redirect to teams or intended route
    const redirectTo = router.currentRoute.value.query.redirect || '/teams'
    await router.push(redirectTo)
  } catch (e) {
    console.error('Login error:', e)

    // Handle different error types
    if (e.response?.status === 401) {
      errors.value.general = 'Invalid username or password'
    } else if (e.response?.status === 429) {
      errors.value.general = 'Too many login attempts. Please try again later.'
    } else if (e.response?.data?.message) {
      errors.value.general = e.response.data.message
    } else {
      errors.value.general = 'Login failed. Please check your connection and try again.'
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
        <h2>Welcome Back</h2>
        <p>Sign in to manage your dragon boat teams</p>
      </div>

      <form @submit.prevent="onSubmit" :class="styles.loginForm">
        <!-- Username Field -->
        <div :class="styles.formGroup">
          <label for="username">Username</label>
          <div :class="styles.inputContainer">
            <input
              id="username"
              v-model="username"
              @input="clearError('username')"
              @blur="validateUsername"
              type="text"
              autocomplete="username"
              required
              :class="{ error: errors.username }"
              placeholder="Enter your username"
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
          <label for="password">Password</label>
          <div :class="styles.inputContainer">
            <input
              id="password"
              v-model="password"
              @input="clearError('password')"
              @blur="validatePassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              :class="{ error: errors.password }"
              placeholder="Enter your password"
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

        <!-- Remember Me -->
        <div :class="styles.formOptions">
          <label :class="styles.checkboxContainer">
            <input v-model="rememberMe" type="checkbox" />
            <span class="checkmark"></span>
            Remember me
          </label>
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
          :class="[styles.loginButton, { loading: loading }]"
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
          <span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
        </button>
      </form>
      <div :class="styles.demoHelp">
        <p :class="styles.demoText">
          <strong>Demo credentials:</strong><br />
          Username: <code>test_user</code><br />
          Password: <code>test_user1234</code>
        </p>
      </div>
    </div>
  </div>
</template>
