<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useMembershipStore } from '@/stores/membership'
import { MEMBERSHIP_ROLE_LABELS, PERSON_SIDE_LABELS } from '@/constants'
import AddPersonModal from '@/components/modals/AddPersonModal.vue'
import styles from '@/assets/styles/team-members.module.css'

const route = useRoute()
const router = useRouter()
const teamsStore = useTeamsStore()
const membershipStore = useMembershipStore()

const showAddPerson = ref(false)

const teamId = computed(() => route.params.id)

// Team + memberships are loaded by the parent layout; read from the stores.
const team = computed(() => teamsStore.getTeamById(teamId.value) || teamsStore.currentTeam)

// Membership.Role: 1 = Player, 2 = Captain, 3 = Coach, 4 = Manager
const EDIT_ROLES = [2, 3, 4]
const canManage = computed(() => EDIT_ROLES.includes(Number(team.value?.my_role)))

const isTeamFull = computed(() => {
  const max = team.value?.max_members || 22
  return membershipStore.teamMemberships.length >= max
})

const filteredMemberships = computed(() => membershipStore.filteredTeamMemberships)

// Methods
const loadMembers = async () => {
  try {
    await membershipStore.fetchTeamMemberships(teamId.value)
  } catch (error) {
    console.error('Failed to load team memberships:', error)
  }
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
      const result = await membershipStore.removePersonFromTeam(teamId.value, membership.person.id)
      if (!result.success) {
        alert(`Failed to remove person: ${result.error}`)
      }
    } catch (error) {
      console.error('Remove person error:', error)
      alert('An unexpected error occurred while removing the person.')
    }
  }
}

const getRoleLabel = (role) => MEMBERSHIP_ROLE_LABELS[role] || 'Unknown'
const getSideLabel = (side) => PERSON_SIDE_LABELS[side] || 'Unknown'

// Icon matches the actual side: left arrow for Left, right for Right,
// double arrow for Both/Either. Keyed off the human label so it stays
// correct regardless of the raw side code.
const getSidePath = (side) => {
  const label = String(getSideLabel(side)).toLowerCase()
  if (label.includes('both') || label.includes('either')) {
    return 'M7 8l-4 4 4 4M3 12h18M17 8l4 4-4 4' // double arrow
  }
  if (label.includes('left')) {
    return 'M11 8l-4 4 4 4M7 12h14' // left arrow
  }
  if (label.includes('right')) {
    return 'M13 8l4 4-4 4M17 12H3' // right arrow
  }
  return 'M7 8l-4 4 4 4M3 12h18M17 8l4 4-4 4'
}

const handlePersonAdded = () => {
  showAddPerson.value = false
}

const handleSearchChange = (event) => {
  membershipStore.setSearchQuery(event.target.value)
}

// Role filter chips (values match Membership.Role; '' = All)
const roleFilters = [
  { value: '', label: 'All' },
  { value: '1', label: 'Players' },
  { value: '2', label: 'Captains' },
  { value: '3', label: 'Coaches' },
  { value: '4', label: 'Managers' },
]
const setRoleFilter = (value) => {
  membershipStore.updateFilters({ role: value })
}
</script>

<template>
  <div :class="styles.membersTab">
    <!-- Toolbar: search + add -->
    <div :class="styles.membersToolbar">
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
        <span :class="styles.addLabel">Add Person</span>
      </button>
    </div>

    <!-- Role filter chips -->
    <div :class="styles.filterChips">
      <button
        v-for="rf in roleFilters"
        :key="rf.value"
        @click="setRoleFilter(rf.value)"
        :class="[styles.chip, { [styles.chipActive]: membershipStore.filters.role === rf.value }]"
      >
        {{ rf.label }}
      </button>
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
        <div :class="styles.memberHeader">
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

          <div :class="styles.memberInfo">
            <h4 :class="styles.memberName">{{ membership.person.name }}</h4>
            <p :class="styles.memberRole">{{ getRoleLabel(membership.role) }}</p>
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

        <div :class="styles.memberDetails">
          <span v-if="membership.person.height" :class="styles.detailItem">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"
              />
            </svg>
            {{ membership.person.height }} cm
          </span>
          <span v-if="membership.person.weight" :class="styles.detailItem">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 9v6M6.5 7v10M6.5 12h11M17.5 7v10M20 9v6"
              />
            </svg>
            {{ membership.person.weight }} kg
          </span>
          <span :class="styles.detailItem">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="getSidePath(membership.person.side)"
              />
            </svg>
            {{ getSideLabel(membership.person.side) }}
          </span>
          <span v-if="membership.person.phone" :class="styles.detailItem">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"
              />
            </svg>
            {{ membership.person.phone }}
          </span>
        </div>
      </div>
    </div>

    <!-- Add Person Modal -->
    <AddPersonModal
      v-if="showAddPerson && team"
      :team-id="team.id"
      :team-name="team.name"
      @close="showAddPerson = false"
      @success="handlePersonAdded"
    />
  </div>
</template>
