<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import styles from '@/assets/styles/app-layout.module.css'

const router = useRouter()
const auth = useAuthStore()

// UI State
const sidebarCollapsed = ref(false)

// Computed properties
const currentUser = computed(() => auth.username)

// Navigation items
const navigationItems = [
  {
    name: 'Teams',
    path: '/teams',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  },
  {
    name: 'Persons',
    path: '/persons',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div :class="styles.appLayout">
    <!-- Sidebar -->
    <aside :class="[styles.sidebar, { collapsed: sidebarCollapsed }]">
      <!-- Logo -->
      <div :class="styles.sidebarHeader">
        <div :class="styles.logoContainer">
          <img alt="Vue logo" :class="styles.logo" src="../../assets/images/logo.png" width="96" height="96" />
        </div>
      </div>

      <!-- Navigation -->
      <nav :class="styles.sidebarNav">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          :class="styles.navItem"
          :title="sidebarCollapsed ? item.name : ''"
        >
          <svg :class="styles.navIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          <span v-if="!sidebarCollapsed" :class="styles.navText">{{ item.name }}</span>
        </RouterLink>
      </nav>

      <!-- User Section -->
      <div :class="styles.sidebarFooter">
        <div :class="[styles.userSection, { collapsed: sidebarCollapsed }]">
          <div :class="styles.userAvatar">
            {{ auth.userInitials }}
          </div>
          <div v-if="!sidebarCollapsed" :class="styles.userInfo">
            <div :class="styles.userName">{{ currentUser || 'User' }}</div>
            <!--            <div :class="styles.userEmail">{{ currentUser?.email || 'user@example.com' }}</div>-->
          </div>
        </div>
        <button
          @click="handleLogout"
          :class="styles.logoutButton"
          :title="sidebarCollapsed ? 'Logout' : ''"
        >
          <svg :class="styles.logoutIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span v-if="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div :class="styles.mainArea">
      <!-- Main Content -->
      <main :class="styles.mainContent">
        <slot />
      </main>
    </div>
  </div>
</template>
