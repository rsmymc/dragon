<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layout Components
import AppLayout from '@/components/AppLayout.vue'
import AuthLayout from '@/components/AuthLayout.vue'

const route = useRoute()
const auth = useAuthStore()

// Computed properties to determine which layout to use
const isAuthenticated = computed(() => auth.isAuthenticated)

const isAuthPage = computed(() => {
  return route.meta?.layout === 'auth' ||
    route.name === 'login' ||
    route.name === 'register'
})

// Initialize authentication state when app loads
onMounted(() => {
  //auth.initializeAuth()
})
</script>

<template>
  <div id="app">
    <!-- Auth Layout (Login/Register pages) -->
    <AuthLayout v-if="isAuthPage">
      <RouterView />
    </AuthLayout>

    <!-- Main App Layout (Authenticated users) -->
    <AppLayout v-else-if="isAuthenticated">
      <RouterView />
    </AppLayout>
  </div>
</template>

<style>
/* Global app styles only */
#app {
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #f8fafc;
}
</style>
