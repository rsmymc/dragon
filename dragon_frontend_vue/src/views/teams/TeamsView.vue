<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTeamsStore } from '@/stores/teams.js'

import styles from '@/assets/styles/teams-list.module.css'

const router = useRouter()
const teamsStore = useTeamsStore()
const { t } = useI18n()

// Membership.Role is an IntegerChoices enum:
//   1 = Player, 2 = Captain, 3 = Coach, 4 = Manager
// Captain/Coach/Manager may edit or delete; Player (the default member) may not.
const EDIT_ROLES = [2, 3, 4]

// Can the current user manage (edit/delete) this team?
// `my_role` is the integer role returned per team by TeamSerializer (null if
// the user has no membership on that team).
const canManage = (team) => EDIT_ROLES.includes(Number(team?.my_role))

// Join-modal state
const showJoinModal = ref(false)
const joinCode = ref('')
const joinError = ref('')
const joinSubmitting = ref(false)

// Team-code "Copied!" feedback (keyed by the code, cleared after a short delay)
const copiedCode = ref(null)
let copiedTimer = null

// Computed properties from store
const teams = computed(() => teamsStore.filteredTeams)
const isLoading = computed(() => teamsStore.isLoading)
const error = computed(() => teamsStore.error)
const searchQuery = computed({
  get: () => teamsStore.searchQuery,
  set: (value) => teamsStore.setSearchQuery(value),
})

// Load teams when component mounts
onMounted(async () => {
  await teamsStore.fetchTeams()
})

onUnmounted(() => {
  clearTimeout(copiedTimer)
})

// Methods
const createTeam = () => {
  router.push('/teams/create')
}

const openJoinModal = () => {
  joinCode.value = ''
  joinError.value = ''
  showJoinModal.value = true
}

const closeJoinModal = () => {
  showJoinModal.value = false
}

const submitJoin = async () => {
  const code = joinCode.value.trim()
  if (!code) {
    joinError.value = t('teams.joinCodeRequired')
    return
  }

  joinSubmitting.value = true
  joinError.value = ''

  const result = await teamsStore.joinTeam(code)

  joinSubmitting.value = false

  if (result.success) {
    showJoinModal.value = false
    showNotification('success', t('teams.joinedTeam', { name: result.team.name }))
  } else {
    // Show the backend reason inline (invalid code / already a member)
    joinError.value = result.error
  }
}

const copyCode = async (code) => {
  const ok = await copyToClipboard(code)
  if (ok) {
    copiedCode.value = code
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copiedCode.value = null
    }, 1500)
  } else {
    showNotification('error', t('teams.copyFailed'))
  }
}

// Copy helper with a fallback for non-secure contexts (e.g. opening the app
// over a LAN IP on http, where navigator.clipboard is unavailable).
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path below
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

const viewTeam = (teamId) => {
  router.push(`/teams/${teamId}/trainings`)
}

const editTeam = (team) => {
  if (!canManage(team)) return // guard: players can't reach edit
  router.push(`/teams/${team.id}/edit?from=list`)
}

const deleteTeam = async (team) => {
  if (!canManage(team)) return // guard: players can't delete

  // Create custom confirmation dialog
  const confirmed = await showDeleteConfirmation(team)
  if (!confirmed) return

  try {
    const result = await teamsStore.deleteTeam(team.id)
    if (result.success) {
      // Show success message
      showNotification('success', t('teams.deleteSuccess', { name: team.name }))
    } else {
      // Show error message
      showNotification('error', result.error || t('teams.deleteFailed'))
    }
  } catch (error) {
    console.error('Error deleting team:', error)
    showNotification('error', t('common.unexpectedError'))
  }
}

// Enhanced confirmation function
const showDeleteConfirmation = (team) => {
  return new Promise((resolve) => {
    const message = t('teams.deleteConfirm', {
      name: team.name,
      count: team.active_member_count || 0,
    })

    const confirmed = confirm(message)
    resolve(confirmed)
  })
}

// Simple notification function (you can enhance this with a toast library)
const showNotification = (type, message) => {
  if (type === 'success') {
    console.log('✅ SUCCESS:', message)
    // You can replace this with a toast notification
  } else {
    console.error('❌ ERROR:', message)
    // You can replace this with a toast notification
  }
}

// Progress bar fill: brand blue while filling, teal once the roster is full
const progressPercent = (team) => {
  const current = team.active_member_count || 0
  const max = team.max_members || 22
  return Math.min((current / max) * 100, 100)
}

const progressColor = (team) =>
    (team.active_member_count || 0) >= (team.max_members || 22)
        ? 'var(--color-success)'
        : 'var(--color-primary)'

// Inline styles for the join modal (self-contained, no CSS-module dependency).
// Colours reference the brand tokens - custom properties resolve in inline styles.
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 34, 95, 0.55)', // brand-blue tinted scrim
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  zIndex: 1000,
}
const modalStyle = {
  background: 'var(--color-surface)',
  borderRadius: '12px',
  padding: '24px',
  width: '100%',
  maxWidth: '400px',
  maxHeight: '90dvh', // scrolls instead of clipping on short/landscape screens
  overflowY: 'auto',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
}
const modalTitleStyle = {
  margin: '0 0 6px',
  fontSize: '20px',
  color: 'var(--color-text-strong)',
}
const modalHintStyle = {
  margin: '0 0 16px',
  color: 'var(--color-text-muted)',
  fontSize: '14px',
}
const inputStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '16px', // keeps iOS from zooming on focus
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: 'var(--color-text-strong)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '8px',
  boxSizing: 'border-box',
}
const errorTextStyle = { color: 'var(--color-danger)', fontSize: '14px', marginTop: '8px' }
const actionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '20px',
}
</script>

<template>
  <div :class="styles.teamsPage">
    <!-- Page Header -->
    <div :class="styles.pageHeader">
      <div :class="styles.headerLeft">
        <h1 :class="styles.pageTitle">{{ t('teams.title') }}</h1>
      </div>
      <div :class="styles.headerRight">
        <button @click="openJoinModal" :class="styles.btnSecondary">
          {{ t('teams.joinButton') }}
        </button>
        <button @click="createTeam" :class="styles.btnPrimary">
          <svg :class="styles.btnIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {{ t('teams.createButton') }}
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <!--    <div :class="styles.searchSection">
          <div :class="styles.searchBar">
            <div :class="styles.searchInputContainer">
              <svg :class="styles.searchIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search teams by name or description..."
                :class="styles.searchInput"
              />
            </div>
          </div>

          <div :class="styles.filters">
            <select
              v-model="teamsStore.filters.sortBy"
              @change="teamsStore.updateFilters({ sortBy: $event.target.value })"
              :class="styles.filterSelect"
            >
              <option value="name">Sort by Name</option>
              <option value="created_at">Sort by Date Created</option>
              <option value="active_member_count">Sort by Member Count</option>
            </select>
          </div>
        </div>-->

    <!-- Teams Grid -->
    <div :class="styles.teamsContent">
      <!-- Loading State -->
      <div v-if="isLoading" :class="styles.loadingState">
        <div :class="styles.loadingSpinner"></div>
        <p>{{ t('teams.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" :class="styles.errorState">
        <svg :class="styles.errorIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3>{{ t('teams.errorTitle') }}</h3>
        <p>{{ error }}</p>
        <button @click="teamsStore.fetchTeams()" :class="styles.btnSecondary">
          {{ t('common.tryAgain') }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="teams.length === 0" :class="styles.emptyState">
        <svg :class="styles.emptyIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3>{{ t('teams.emptyTitle') }}</h3>
        <p v-if="searchQuery">{{ t('teams.emptySearch') }}</p>
        <p v-else>{{ t('teams.emptyHint') }}</p>
        <button @click="createTeam" :class="styles.btnPrimary">
          {{ t('teams.createFirst') }}
        </button>
      </div>

      <!-- Teams Grid -->
      <div v-else :class="styles.teamsGrid">
        <div
            v-for="team in teams"
            :key="team.id"
            :class="styles.teamCard"
            @click="viewTeam(team.id)"
        >
          <!-- Team Card Header -->
          <div :class="styles.cardHeader">
            <div>
              <h3 :class="styles.teamName">{{ team.name }}</h3>
              <button
                  v-if="team.code"
                  @click.stop="copyCode(team.code)"
                  :title="copiedCode === team.code ? t('common.copied') : t('teams.copyCodeTitle')"
                  :class="styles.codeBadge"
                  :style="
                  copiedCode === team.code
                    ? {
                        backgroundColor: 'var(--color-accent)',
                        color: 'var(--color-text-strong)',
                        borderColor: 'var(--color-accent)',
                      }
                    : null
                "
              >
                <template v-if="copiedCode === team.code">
                  {{ t('common.copied') }}
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                    />
                  </svg>
                </template>
                <template v-else>
                  {{ team.code }}
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </template>
              </button>
            </div>
            <!-- Edit/Delete only enabled for manager/coach/captain -->
            <div v-if="canManage(team)" :class="styles.teamActions" @click.stop>
              <button
                  @click="editTeam(team)"
                  :class="styles.actionBtnTeamList"
                  :title="t('teams.editTeam')"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                  @click="deleteTeam(team)"
                  :class="[styles.actionBtnTeamList, styles.delete]"
                  :title="t('teams.deleteTeam')"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
          <!-- Team Stats -->
          <div :class="styles.teamStats">
            <div :class="styles.statItem">
              <span :class="styles.statLabel">{{ t('teams.members') }}</span>
              <span :class="styles.statValue"
              >{{ team.active_member_count || 0 }}/{{ team.max_members || 22 }}</span
              >
            </div>

            <div :class="styles.statItem">
              <span :class="styles.statLabel">{{ t('teams.city') }}</span>
              <span :class="styles.statValue">{{ team.city || t('teams.notAssigned') }}</span>
            </div>
          </div>

          <!-- Team Status and Progress -->
          <div :class="styles.teamFooter">
            <div :class="styles.memberProgress">
              <div :class="styles.progressBar">
                <div
                    :class="styles.progressFill"
                    :style="{
                    width: `${progressPercent(team)}%`,
                    backgroundColor: progressColor(team),
                  }"
                ></div>
              </div>
              <span :class="styles.progressText">
                {{ t('teams.percentFull', { percent: Math.round(progressPercent(team)) }) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Join Team Modal -->
    <div v-if="showJoinModal" :style="overlayStyle" @click.self="closeJoinModal">
      <div :style="modalStyle">
        <h2 :style="modalTitleStyle">{{ t('teams.joinModalTitle') }}</h2>
        <p :style="modalHintStyle">{{ t('teams.joinModalHint') }}</p>

        <input
            v-model="joinCode"
            type="text"
            :placeholder="t('teams.joinCodePlaceholder')"
            :style="inputStyle"
            @keyup.enter="submitJoin"
        />

        <p v-if="joinError" :style="errorTextStyle">{{ joinError }}</p>

        <div :style="actionsStyle">
          <button @click="closeJoinModal" :class="styles.btnSecondary" :disabled="joinSubmitting">
            {{ t('common.cancel') }}
          </button>
          <button @click="submitJoin" :class="styles.btnPrimary" :disabled="joinSubmitting">
            {{ joinSubmitting ? t('teams.joining') : t('teams.join') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
