<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.js'
import { setLocale, SUPPORTED_LOCALES } from '@/i18n.js'
import styles from '@/assets/styles/app-layout.module.css'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const { t, locale } = useI18n()

// UI State
const sidebarCollapsed = ref(false) // desktop collapse (unchanged)
const mobileOpen = ref(false) // mobile drawer open/closed

// Computed properties
const currentUser = computed(() => auth.person?.name || auth.username)

// Navigation items (labelKey is translated reactively in the template)
const navigationItems = [
  {
    labelKey: 'layout.myTeams',
    path: '/teams',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    labelKey: 'layout.profile',
    path: '/profile',
    icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
  },
  /*  {
      labelKey: 'layout.settings',
      path: '/settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    },*/
]

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}

const closeMobile = () => {
  mobileOpen.value = false
}

const switchLocale = (code) => {
  setLocale(code)
}

// Close the drawer whenever the route changes (e.g. after tapping a nav item)
watch(
  () => route.path,
  () => {
    mobileOpen.value = false
  },
)

// Lock body scroll while the mobile drawer is open
watch(mobileOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div :class="styles.appLayout">
    <!-- Mobile top bar (visible on mobile only) -->
    <header :class="styles.mobileTopBar">
      <button
        type="button"
        :class="styles.hamburger"
        @click="toggleMobile"
        :aria-label="t('layout.toggleMenu')"
        :aria-expanded="mobileOpen"
      >
        <svg :class="styles.hamburgerIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <span :class="styles.mobileAppName">DragonBoat Manager</span>
    </header>

    <!-- Backdrop behind the mobile drawer -->
    <div v-if="mobileOpen" :class="styles.backdrop" @click="closeMobile"></div>

    <!-- Sidebar -->
    <aside
      :class="[
        styles.sidebar,
        { [styles.collapsed]: sidebarCollapsed, [styles.mobileOpen]: mobileOpen },
      ]"
    >
      <!-- Logo -->
      <div :class="styles.sidebarHeader">
        <div :class="styles.logoContainer">
          <img
            alt="DragonBoat Logo"
            :class="styles.logo"
            src="../../assets/images/logo.png"
            width="196"
            height="196"
          />
        </div>
      </div>

      <!-- Navigation -->
      <nav :class="styles.sidebarNav">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          :class="styles.navItem"
          :title="sidebarCollapsed ? t(item.labelKey) : ''"
          @click="closeMobile"
        >
          <svg :class="styles.navIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
          </svg>
          <span v-if="!sidebarCollapsed" :class="styles.navText">{{ t(item.labelKey) }}</span>
        </RouterLink>
      </nav>

      <!-- User Section -->
      <div :class="styles.sidebarFooter">
        <!-- Language Switcher -->
        <div
          v-if="!sidebarCollapsed"
          :class="styles.langSwitcher"
          role="group"
          :aria-label="t('layout.language')"
        >
          <button
            v-for="code in SUPPORTED_LOCALES"
            :key="code"
            type="button"
            :class="[styles.langButton, { [styles.langButtonActive]: locale === code }]"
            @click="switchLocale(code)"
          >
            {{ code.toUpperCase() }}
          </button>
        </div>

        <!--        <div :class="[styles.userSection, { [styles.collapsed]: sidebarCollapsed }]">
                  <div :class="styles.userAvatar">
                    {{ auth.userInitials }}
                  </div>
                  <div v-if="!sidebarCollapsed" :class="styles.userInfo">
                    <div :class="styles.userName">{{ currentUser || t('layout.user') }}</div>
                  </div>
                </div>-->
        <button
          @click="handleLogout"
          :class="styles.logoutButton"
          :title="sidebarCollapsed ? t('layout.logout') : ''"
        >
          <svg :class="styles.logoutIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span v-if="!sidebarCollapsed">{{ t('layout.logout') }}</span>
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
