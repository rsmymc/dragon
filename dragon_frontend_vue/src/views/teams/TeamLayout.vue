<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useMembershipStore } from '@/stores/membership'
import styles from '@/assets/styles/team-layout.module.css'

const route = useRoute()
const router = useRouter()
const teamsStore = useTeamsStore()
const membershipStore = useMembershipStore()

const team = ref(null)
const codeCopied = ref(false)
let copyTimer = null

// Membership.Role: 1 = Player, 2 = Captain, 3 = Coach, 4 = Manager
const EDIT_ROLES = [2, 3, 4]
const canManage = computed(() => EDIT_ROLES.includes(Number(team.value?.my_role)))

const teamId = computed(() => route.params.id)

// Active tab derived from the child route name
const isMembersActive = computed(() => route.name === 'team-detail')
const isTrainingsActive = computed(() => route.name === 'trainings')

// Team summary (shared across tabs)
const maxMembers = computed(() => team.value?.max_members || 22)
const currentMemberCount = computed(() => membershipStore.teamMemberships.length)
const memberProgress = computed(() => (currentMemberCount.value / maxMembers.value) * 100)
const isTeamFull = computed(() => currentMemberCount.value >= maxMembers.value)
const isAlmostFull = computed(
  () => currentMemberCount.value >= maxMembers.value * 0.8 && !isTeamFull.value,
)

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const loadTeam = async () => {
  try {
    const existing = teamsStore.getTeamById(teamId.value)
    if (existing) {
      team.value = existing
    } else {
      await teamsStore.fetchTeam(teamId.value)
      team.value = teamsStore.currentTeam
      if (!team.value) throw new Error('Team not found')
    }
  } catch (error) {
    console.error('Failed to load team:', error)
  }
}

const loadMembers = async () => {
  try {
    await membershipStore.fetchTeamMemberships(teamId.value)
  } catch (error) {
    console.error('Failed to load team memberships:', error)
  }
}

const copyTeamCode = async () => {
  if (!team.value?.code) return
  const ok = await copyToClipboard(team.value.code)
  if (ok) {
    codeCopied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (codeCopied.value = false), 1500)
  }
}

// Copy helper with a fallback for non-secure contexts (e.g. LAN IP on http).
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

const deleteTeam = async () => {
  if (!canManage.value || !team.value) return

  const confirmed = confirm(
    `Delete "${team.value.name}"?\n\n` +
      `This action cannot be undone and will remove the team and all associated data.`,
  )
  if (!confirmed) return

  try {
    const result = await teamsStore.deleteTeam(team.value.id)
    if (result.success) {
      router.push('/teams')
    } else {
      alert(result.error || 'Failed to delete team')
    }
  } catch (error) {
    console.error('Delete team error:', error)
    alert('An unexpected error occurred while deleting the team.')
  }
}

onMounted(() => {
  loadTeam()
  loadMembers()
})

onUnmounted(() => {
  clearTimeout(copyTimer)
  membershipStore.clearTeamMemberships()
  membershipStore.clearFilters()
})
</script>

<template>
  <div :class="styles.teamLayout">
    <!-- Loading State (team identity) -->
    <div v-if="teamsStore.isLoading && !team" :class="styles.loadingState">
      <div :class="styles.loadingSpinner"></div>
      <p>Loading team...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="teamsStore.error && !team" :class="styles.errorState">
      <div :class="styles.errorIcon">⚠️</div>
      <h3>Team Not Found</h3>
      <p>{{ teamsStore.error }}</p>
      <button @click="loadTeam" :class="styles.btnRetry">Try Again</button>
      <router-link to="/teams" :class="styles.btnSecondary">← Back to Teams</router-link>
    </div>

    <!-- Team shell -->
    <div v-else-if="team" :class="styles.teamContainer">
      <!-- Back link -->
      <router-link to="/teams" :class="styles.backLink">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Teams
      </router-link>

      <!-- Header card: identity + summary + tabs (persistent across tabs) -->
      <div :class="styles.teamHeader">
        <div :class="styles.headerTop">
          <h1 :class="styles.teamName">{{ team.name }}</h1>

          <!-- edit/delete: only for manager/coach/captain -->
          <div v-if="canManage" :class="styles.teamHeaderActions">
            <router-link
              :to="`/teams/${teamId}/edit?from=detail`"
              :class="styles.actionBtnTeam"
              title="Edit Team"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </router-link>
            <button
              @click="deleteTeam"
              :class="[styles.actionBtnTeam, styles.delete]"
              title="Delete Team"
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

        <!-- Summary: stats + compact invite chip -->
        <div :class="styles.teamMeta">
          <div :class="styles.teamStats">
            <div :class="styles.statItem">
              <span :class="styles.statLabel">Members</span>
              <span :class="styles.statValue">{{ currentMemberCount }}/{{ maxMembers }}</span>
            </div>
            <div v-if="team.city" :class="styles.statItem">
              <span :class="styles.statLabel">Location</span>
              <span :class="styles.statValue">{{ team.city }}</span>
            </div>
            <div :class="styles.statItem">
              <span :class="styles.statLabel">Created</span>
              <span :class="styles.statValue">{{ formatDate(team.created_at) }}</span>
            </div>
          </div>

          <button
            v-if="team.code"
            @click="copyTeamCode"
            :title="codeCopied ? 'Copied!' : 'Copy team code'"
            :class="styles.codeBadge"
            :style="
              codeCopied
                ? {
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-text-strong)',
                    borderColor: 'var(--color-accent)',
                  }
                : null
            "
          >
            <template v-if="codeCopied">
              Copied!
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <!-- Progress -->
        <div :class="styles.progressRow">
          <div :class="styles.memberProgress">
            <div :class="styles.progressBar">
              <div
                :class="[
                  styles.progressFill,
                  { [styles.full]: isTeamFull, [styles.almostFull]: isAlmostFull },
                ]"
                :style="{ width: `${memberProgress}%` }"
              ></div>
            </div>
            <span :class="styles.progressText">{{ memberProgress.toFixed(0) }}% Full</span>
          </div>
          <span v-if="isTeamFull" :class="[styles.statusBadge, styles.full]">Team Full</span>
          <span v-else-if="isAlmostFull" :class="[styles.statusBadge, styles.almostFull]"
            >Almost Full</span
          >
        </div>

        <!-- Tab strip -->
        <nav :class="styles.tabStrip">
          <router-link
            :to="`/teams/${teamId}`"
            :class="[styles.tab, { [styles.tabActive]: isMembersActive }]"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Members
          </router-link>
          <router-link
            :to="`/teams/${teamId}/trainings`"
            :class="[styles.tab, { [styles.tabActive]: isTrainingsActive }]"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Trainings
          </router-link>
        </nav>
      </div>

      <!-- Active tab renders here -->
      <router-view />
    </div>
  </div>
</template>
