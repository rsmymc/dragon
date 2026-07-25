<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useMembershipStore } from '@/stores/membership'
import { MEMBERSHIP_ROLE_LABELS, PERSON_SIDE_LABELS } from '@/constants'
import AddPersonModal from '@/components/modals/AddPersonModal.vue'
import styles from '@/assets/styles/team-detail.module.css'

// Composables
const router = useRouter()
const route = useRoute()
const teamsStore = useTeamsStore()
const membershipStore = useMembershipStore()

// Reactive data
const team = ref(null)
const showAddPerson = ref(false)
const codeCopied = ref(false)
let copyTimer = null

// Roles allowed to manage a team (edit/delete team, add/remove members).
// Membership.Role: 1 = Player, 2 = Captain, 3 = Coach, 4 = Manager.
const EDIT_ROLES = [2, 3, 4]
const canManage = computed(() => EDIT_ROLES.includes(Number(team.value?.my_role)))

// Computed
const currentMemberCount = computed(() => {
  return membershipStore.teamMemberships.length
})

const memberProgress = computed(() => {
  const maxMembers = team.value?.max_members || 22
  return (currentMemberCount.value / maxMembers) * 100
})

const isTeamFull = computed(() => {
  const maxMembers = team.value?.max_members || 22
  return currentMemberCount.value >= maxMembers
})

const isAlmostFull = computed(() => {
  const maxMembers = team.value?.max_members || 22
  return currentMemberCount.value >= maxMembers * 0.8 && !isTeamFull.value
})

const filteredMemberships = computed(() => {
  return membershipStore.filteredTeamMemberships
})

// Methods
const loadTeam = async () => {
  const teamId = route.params.id

  try {
    const existingTeam = teamsStore.getTeamById(teamId)
    if (existingTeam) {
      team.value = existingTeam
      return
    }

    await teamsStore.fetchTeam(teamId)
    team.value = teamsStore.currentTeam

    if (!team.value) {
      throw new Error('Team not found')
    }
  } catch (error) {
    console.error('Failed to load team:', error)
  }
}

const loadMembers = async () => {
  const teamId = route.params.id

  try {
    await membershipStore.fetchTeamMemberships(teamId)
    console.log('✅ Team memberships loaded:', membershipStore.teamMemberships.length)
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

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

const editPerson = (membership) => {
  if (!canManage.value) return
  router.push(`/persons/${membership.person.id}/edit`)
}

const removePerson = async (membership) => {
  if (!canManage.value) return

  const confirmed = confirm(
    `Remove "${membership.person.name}" from the team?\n\nThis action cannot be undone.`,
  )
  if (confirmed) {
    try {
      const result = await membershipStore.removePersonFromTeam(team.value.id, membership.person.id)
      if (result.success) {
        console.log('✅ Person removed from team:', membership.person.name)
      } else {
        alert(`Failed to remove person: ${result.error}`)
      }
    } catch (error) {
      console.error('Remove person error:', error)
      alert('An unexpected error occurred while removing the person.')
    }
  }
}

const getRoleLabel = (role) => {
  return MEMBERSHIP_ROLE_LABELS[role] || 'Unknown'
}

const handlePersonAdded = (membership) => {
  console.log('✅ Person successfully added to team:', membership.person.name)
  showAddPerson.value = false
}

const getSideLabel = (side) => {
  return PERSON_SIDE_LABELS[side] || 'Unknown'
}

const handleSearchChange = (event) => {
  membershipStore.setSearchQuery(event.target.value)
}

const handleRoleFilterChange = (event) => {
  membershipStore.updateFilters({ role: event.target.value })
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
  <div :class="styles.teamDetailView">
    <!-- Loading State -->
    <div v-if="teamsStore.isLoading && !team" :class="styles.loadingState">
      <div :class="styles.loadingSpinner"></div>
      <p>Loading team details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="teamsStore.error && !team" :class="styles.errorState">
      <div :class="styles.errorIcon">⚠️</div>
      <h3>Team Not Found</h3>
      <p>{{ teamsStore.error }}</p>
      <button @click="loadTeam" :class="styles.btnRetry">Try Again</button>
      <router-link to="/teams" :class="styles.btnSecondary">← Back to Teams</router-link>
    </div>

    <!-- Team Details -->
    <div v-else-if="team" :class="styles.teamDetailContainer">
      <!-- Back link (above the header card) -->
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

      <!-- Team Header -->
      <div :class="styles.teamHeader">
        <div :class="styles.headerContent">
          <div :class="styles.teamInfo">
            <!-- Title + grouped team actions -->
            <div :class="styles.teamTitle">
              <div :class="styles.teamTitleLeft">
                <h1>{{ team.name }}</h1>
                <div :class="styles.teamBadges">
                  <span v-if="isTeamFull" :class="[styles.statusBadge, styles.full]"
                    >Team Full</span
                  >
                  <span v-else-if="isAlmostFull" :class="[styles.statusBadge, styles.almostFull]"
                    >Almost Full</span
                  >
                </div>
              </div>

              <div :class="styles.teamHeaderActions">
                <router-link :to="`/teams/${team.id}/trainings`" :class="styles.btnSecondary">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View Trainings
                </router-link>

                <!-- edit/delete: only for manager/coach/captain -->
                <template v-if="canManage">
                  <router-link
                    :to="`/teams/${team.id}/edit?from=detail`"
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
                </template>
              </div>
            </div>

            <!-- Meta row: stats + compact invite chip -->
            <div :class="styles.teamMeta">
              <div :class="styles.teamStats">
                <div :class="styles.statItem">
                  <span :class="styles.statLabel">Members</span>
                  <span :class="styles.statValue"
                    >{{ currentMemberCount }}/{{ team.max_members || 22 }}</span
                  >
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

              <!-- Invite Code (compact) -->
              <div v-if="team.code" :class="styles.inviteBox">
                <div>
                  <div :class="styles.inviteLabel">Invite code</div>
                  <div :class="styles.inviteCode">{{ team.code }}</div>
                </div>
                <button
                  @click="copyTeamCode"
                  :class="[styles.inviteBtn, codeCopied ? styles.copied : '']"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      v-if="codeCopied"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {{ codeCopied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
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
          </div>
        </div>
      </div>

      <!-- Members Section -->
      <div :class="styles.membersSection">
        <div :class="styles.sectionContent">
          <!-- Members Header -->
          <div :class="styles.membersHeader">
            <h2>Team Members</h2>
            <div :class="styles.membersControls">
              <!-- Search -->
              <div :class="styles.searchBox">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  :value="membershipStore.searchQuery"
                  @input="handleSearchChange"
                  type="text"
                  placeholder="Search members..."
                  :class="styles.searchInput"
                />
              </div>

              <!-- Filter by Role -->
              <select
                :value="membershipStore.filters.role"
                @change="handleRoleFilterChange"
                :class="styles.roleFilter"
              >
                <option value="">All Roles</option>
                <option value="1">Player</option>
                <option value="2">Captain</option>
                <option value="3">Coach</option>
                <option value="4">Manager</option>
              </select>

              <!-- Add Person lives with the members it affects -->
              <button
                v-if="canManage"
                @click="showAddPerson = true"
                :class="styles.btnPrimary"
                :disabled="isTeamFull"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Person
              </button>
            </div>
          </div>

          <!-- Members Loading -->
          <div v-if="membershipStore.isLoading" :class="styles.membersLoading">
            <div :class="styles.loadingSpinner"></div>
            <p>Loading members...</p>
          </div>

          <!-- Members Error -->
          <div v-else-if="membershipStore.error" :class="styles.errorState">
            <div :class="styles.errorIcon">⚠️</div>
            <h3>Error Loading Members</h3>
            <p>{{ membershipStore.error }}</p>
            <button @click="loadMembers" :class="styles.btnRetry">Try Again</button>
          </div>

          <!-- Empty Members -->
          <div v-else-if="filteredMemberships.length === 0" :class="styles.emptyMembers">
            <div :class="styles.emptyIcon">👥</div>
            <h3>
              {{
                membershipStore.searchQuery || membershipStore.filters.role
                  ? 'No members found'
                  : 'No members yet'
              }}
            </h3>
            <p>
              {{
                membershipStore.searchQuery || membershipStore.filters.role
                  ? 'Try adjusting your search or filter'
                  : 'Start building your dragon boat team by adding members'
              }}
            </p>
            <button
              v-if="canManage && !membershipStore.searchQuery && !membershipStore.filters.role"
              @click="showAddPerson = true"
              :class="styles.btnPrimary"
            >
              Add First Member
            </button>
          </div>

          <!-- Members Grid -->
          <div v-else :class="styles.membersGrid">
            <div
              v-for="membership in filteredMemberships"
              :key="membership.id"
              :class="styles.memberCard"
            >
              <!-- Member Avatar/Initial -->
              <div :class="styles.memberAvatar">
                <img
                  v-if="membership.person.profile_picture_url"
                  :src="membership.person.profile_picture_url"
                  :alt="membership.person.name"
                  :class="styles.avatarImage"
                />
                <div v-else :class="styles.avatarInitial">
                  {{ getInitials(membership.person.name) }}
                </div>
              </div>

              <!-- Member Info -->
              <div :class="styles.memberInfo">
                <h4 :class="styles.memberName">{{ membership.person.name }}</h4>
                <p :class="styles.memberRole">{{ getRoleLabel(membership.role) }}</p>
                <div :class="styles.memberDetails">
                  <span v-if="membership.person.phone" :class="styles.detailItem">
                    📱 {{ membership.person.phone }}
                  </span>
                  <span v-if="membership.person.height" :class="styles.detailItem">
                    📏 {{ membership.person.height }}cm
                  </span>
                  <span v-if="membership.person.weight" :class="styles.detailItem">
                    ⚖️ {{ membership.person.weight }}kg
                  </span>
                  <span :class="styles.detailItem">
                    🧭 {{ getSideLabel(membership.person.side) }}
                  </span>
                  <span v-if="membership.joined_at" :class="styles.detailItem">
                    📅 Joined {{ formatDate(membership.joined_at) }}
                  </span>
                </div>
              </div>
              <!-- Member Actions: only for manager/coach/captain -->
              <div v-if="canManage" :class="styles.memberActions">
                <button
                  @click="editPerson(membership)"
                  :class="[styles.actionBtnMember, styles.edit]"
                  title="Edit Person"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  @click="removePerson(membership)"
                  :class="[styles.actionBtnMember, styles.delete]"
                  title="Remove Person"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        </div>
      </div>
    </div>

    <!-- Add Person Modal -->
    <AddPersonModal
      v-if="showAddPerson"
      :team-id="team.id"
      :team-name="team.name"
      @close="showAddPerson = false"
      @success="handlePersonAdded"
    />
  </div>
</template>
