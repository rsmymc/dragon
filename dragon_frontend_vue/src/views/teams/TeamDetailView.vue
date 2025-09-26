<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useMembershipStore } from '@/stores/membership'
import { MEMBERSHIP_ROLE_LABELS, PERSON_SIDE_LABELS } from '@/constants'
import AddPersonModal from '@/components/modals/AddPersonModal.vue'
import '@/assets/styles/team-detail.css'

// Composables
const router = useRouter()
const route = useRoute()
const teamsStore = useTeamsStore()
const membershipStore = useMembershipStore()

// Reactive data
const team = ref(null)
const showAddPerson = ref(false)

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
    // Check if team is already in store
    const existingTeam = teamsStore.getTeamById(teamId)
    if (existingTeam) {
      team.value = existingTeam
      return
    }

    // Fetch from API
    await teamsStore.fetchTeam(teamId)
    team.value = teamsStore.currentTeam

    if (!team.value) {
      throw new Error('Team not found')
    }
  } catch (error) {
    console.error('Failed to load team:', error)
    // Error handled by template through teamsStore.error
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

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const editPerson = (membership) => {
  // Navigate to person edit page
  router.push(`/persons/${membership.person.id}/edit`)
}

const removePerson = async (membership) => {
  const confirmed = confirm(`Remove "${membership.person.name}" from the team?\n\nThis action cannot be undone.`)
  if (confirmed) {
    try {
      const result = await membershipStore.removePersonFromTeam(team.value.id, membership.person.id)
      if (result.success) {
        console.log('✅ Person removed from team:', membership.person.name)
        // Memberships list will automatically update via store reactivity
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
  // The store will automatically update the team memberships list
}

const getSideLabel = (side) => {
  return PERSON_SIDE_LABELS[side] || 'Unknown'
}

// Search and filter handlers
const handleSearchChange = (event) => {
  membershipStore.setSearchQuery(event.target.value)
}

const handleRoleFilterChange = (event) => {
  membershipStore.updateFilters({ role: event.target.value })
}

// Lifecycle
onMounted(() => {
  loadTeam()
  loadMembers()
})

onUnmounted(() => {
  // Clear team memberships when leaving the component
  membershipStore.clearTeamMemberships()
  membershipStore.clearFilters()
})
</script>

<template>
  <div class="team-detail-view">
    <!-- Loading State -->
    <div v-if="teamsStore.isLoading && !team" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading team details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="teamsStore.error && !team" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Team Not Found</h3>
      <p>{{ teamsStore.error }}</p>
      <button @click="loadTeam" class="btn-retry">Try Again</button>
      <router-link to="/teams" class="btn-secondary">← Back to Teams</router-link>
    </div>

    <!-- Team Details -->
    <div v-else-if="team" class="team-detail-container">
      <!-- Team Header -->
      <div class="team-header">
        <div class="header-content">
          <router-link to="/teams" class="back-link">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Teams
          </router-link>

          <div class="team-info">
            <div class="team-title">
              <h1>{{ team.name }}</h1>
              <div class="team-badges">
                <span v-if="isTeamFull" class="status-badge full">Team Full</span>
                <span v-else-if="isAlmostFull" class="status-badge almost-full">Almost Full</span>
              </div>
            </div>

            <div class="team-stats">
              <div class="stat-item">
                <span class="stat-label">Members</span>
                <span class="stat-value">{{ currentMemberCount }}/{{ team.max_members || 22 }}</span>
              </div>
              <div v-if="team.city" class="stat-item">
                <span class="stat-label">Location</span>
                <span class="stat-value">{{ team.city }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Created</span>
                <span class="stat-value">{{ formatDate(team.created_at) }}</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="member-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${memberProgress}%` }"
                  :class="{
                    'full': isTeamFull,
                    'almost-full': isAlmostFull
                  }"
                ></div>
              </div>
              <span class="progress-text">{{ memberProgress.toFixed(0) }}% Full</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="team-detail-actions">
            <router-link :to="`/teams/${team.id}/edit?from=detail`" class="btn-edit">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit Team
            </router-link>
            <router-link :to="`/teams/${team.id}/trainings`" class="btn-trainings">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              View Trainings
            </router-link>
            <button
              @click="showAddPerson = true"
              class="btn-primary"
              :disabled="isTeamFull"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Add Person
            </button>
          </div>
        </div>
      </div>

      <!-- Members Section -->
      <div class="members-section">
        <div class="section-content">
          <!-- Members Header -->
          <div class="members-header">
            <h2>Team Members</h2>
            <div class="members-controls">
              <!-- Search -->
              <div class="search-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  :value="membershipStore.searchQuery"
                  @input="handleSearchChange"
                  type="text"
                  placeholder="Search members..."
                  class="search-input"
                />
              </div>

              <!-- Filter by Role -->
              <select :value="membershipStore.filters.role" @change="handleRoleFilterChange" class="role-filter">
                <option value="">All Roles</option>
                <option value="1">Player</option>
                <option value="2">Captain</option>
                <option value="3">Coach</option>
                <option value="4">Manager</option>
              </select>
            </div>
          </div>

          <!-- Members Loading -->
          <div v-if="membershipStore.isLoading" class="members-loading">
            <div class="loading-spinner"></div>
            <p>Loading members...</p>
          </div>

          <!-- Members Error -->
          <div v-else-if="membershipStore.error" class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error Loading Members</h3>
            <p>{{ membershipStore.error }}</p>
            <button @click="loadMembers" class="btn-retry">Try Again</button>
          </div>

          <!-- Empty Members -->
          <div v-else-if="filteredMemberships.length === 0" class="empty-members">
            <div class="empty-icon">👥</div>
            <h3>{{ membershipStore.searchQuery || membershipStore.filters.role ? 'No members found' : 'No members yet' }}</h3>
            <p>
              {{ membershipStore.searchQuery || membershipStore.filters.role
              ? 'Try adjusting your search or filter'
              : 'Start building your dragon boat team by adding members'
              }}
            </p>
            <button
              v-if="!membershipStore.searchQuery && !membershipStore.filters.role"
              @click="showAddPerson = true"
              class="btn-primary"
            >
              Add First Member
            </button>
          </div>

          <!-- Members Grid -->
          <div v-else class="members-grid">
            <div
              v-for="membership in filteredMemberships"
              :key="membership.id"
              class="member-card"
            >
              <!-- Member Avatar/Initial -->
              <div class="member-avatar">
                <img
                  v-if="membership.person.profile_picture_url"
                  :src="membership.person.profile_picture_url"
                  :alt="membership.person.name"
                  class="avatar-image"
                />
                <div v-else class="avatar-initial">
                  {{ getInitials(membership.person.name) }}
                </div>
              </div>

              <!-- Member Info -->
              <div class="member-info">
                <h4 class="member-name">{{ membership.person.name }}</h4>
                <p class="member-role">{{ getRoleLabel(membership.role) }}</p>
                <div class="member-details">
                  <span v-if="membership.person.phone" class="detail-item">
                    📱 {{ membership.person.phone }}
                  </span>
                  <span v-if="membership.person.height" class="detail-item">
                    📏 {{ membership.person.height }}cm
                  </span>
                  <span v-if="membership.person.weight" class="detail-item">
                    ⚖️ {{ membership.person.weight }}kg
                  </span>
                  <span class="detail-item">
                    🧭 {{ getSideLabel(membership.person.side) }}
                  </span>
                  <span v-if="membership.joined_at" class="detail-item">
                    📅 Joined {{ formatDate(membership.joined_at) }}
                  </span>
                </div>
              </div>

              <!-- Member Actions -->
              <div class="member-actions">
                <button
                  @click="editPerson(membership)"
                  class="action-btn-member edit"
                  title="Edit Person"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  @click="removePerson(membership)"
                  class="action-btn-member delete"
                  title="Remove Person"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
