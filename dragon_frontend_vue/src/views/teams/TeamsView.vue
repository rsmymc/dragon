<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams.js'

import styles from '@/assets/styles/teams-list.module.css'

const router = useRouter()
const teamsStore = useTeamsStore()

// Local UI state
const showCreateModal = ref(false)
const selectedTeamId = ref(null)

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

// Methods
const createTeam = () => {
  router.push('/teams/create')
}

const viewTeam = (teamId) => {
  router.push(`/teams/${teamId}`)
}

const editTeam = (teamId) => {
  router.push(`/teams/${teamId}/edit?from=list`)
}

const deleteTeam = async (team) => {
  // Create custom confirmation dialog
  const confirmed = await showDeleteConfirmation(team)
  if (!confirmed) return

  try {
    const result = await teamsStore.deleteTeam(team.id)
    if (result.success) {
      // Show success message
      showNotification('success', `Team "${team.name}" deleted successfully`)
    } else {
      // Show error message
      showNotification('error', result.error || 'Failed to delete team')
    }
  } catch (error) {
    console.error('Error deleting team:', error)
    showNotification('error', 'An unexpected error occurred')
  }
}

// Enhanced confirmation function
const showDeleteConfirmation = (team) => {
  return new Promise((resolve) => {
    const message =
      `Are you sure you want to delete "${team.name}"?\n\n` +
      `This action cannot be undone and will:\n` +
      `• Remove the team permanently\n` +
      `• Remove all associated data\n` +
      `• Affect ${team.active_member_count || 0} team members`

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
</script>

<template>
  <div :class="styles.teamsPage">
    <!-- Page Header -->
    <div :class="styles.pageHeader">
      <div :class="styles.headerLeft">
        <h1 :class="styles.pageTitle">Teams</h1>
      </div>
      <div :class="styles.headerRight">
        <button @click="createTeam" :class="styles.btnPrimary">
          <svg :class="styles.btnIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create Team
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div :class="styles.searchSection">
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
    </div>

    <!-- Teams Grid -->
    <div :class="styles.teamsContent">
      <!-- Loading State -->
      <div v-if="isLoading" :class="styles.loadingState">
        <div :class="styles.loadingSpinner"></div>
        <p>Loading teams...</p>
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
        <h3>Error Loading Teams</h3>
        <p>{{ error }}</p>
        <button @click="teamsStore.fetchTeams()" :class="styles.btnSecondary">Try Again</button>
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
        <h3>No Teams Found</h3>
        <p v-if="searchQuery">No teams match your search criteria</p>
        <p v-else>Get started by creating your first dragon boat team</p>
        <button @click="createTeam" :class="styles.btnPrimary">Create Your First Team</button>
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
            <h3 :class="styles.teamName">{{ team.name }}</h3>
            <div :class="styles.teamActions" @click.stop>
              <button
                @click="editTeam(team.id)"
                :class="styles.actionBtnTeamList"
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
              </button>
              <button
                @click="deleteTeam(team)"
                :class="[styles.actionBtnTeamList, 'delete']"
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
          <!-- Team Stats -->
          <div :class="styles.teamStats">
            <div :class="styles.statItem">
              <span :class="styles.statLabel">Members</span>
              <span :class="styles.statValue"
                >{{ team.active_member_count || 0 }}/{{ team.max_members || 22 }}</span
              >
            </div>

            <div :class="styles.statItem">
              <span :class="styles.statLabel">City</span>
              <span :class="styles.statValue">{{ team.city || 'Not assigned' }}</span>
            </div>
          </div>

          <!-- Team Status and Progress -->
          <div :class="styles.teamFooter">
            <div :class="styles.memberProgress">
              <div :class="styles.progressBar">
                <div
                  :class="styles.progressFill"
                  :style="{
                    width: `${Math.min(((team.active_member_count || 0) / (team.max_members || 22)) * 100, 100)}%`,
                    backgroundColor:
                      team.active_member_count >= team.max_members ? '#10b981' : '#3b82f6',
                  }"
                ></div>
              </div>
              <span :class="styles.progressText">
                {{
                  Math.round(((team.active_member_count || 0) / (team.max_members || 22)) * 100)
                }}% full
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
