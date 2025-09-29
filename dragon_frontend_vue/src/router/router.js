import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LoginView from '@/views/LoginView.vue'
import TeamsView from '@/views/teams/TeamsView.vue'
import CreateTeamView from '@/views/teams/CreateTeamView.vue'
import EditTeamView from '@/views/teams/EditTeamView.vue'
import TeamDetailView from '@/views/teams/TeamDetailView.vue'
import EditPersonView from '@/views/teams/EditPersonView.vue'
import CreateTrainingView from '@/views/trainings/CreateTrainingView.vue'
import TeamTrainingsView from '@/views/trainings/TeamTrainingsView.vue'
import TrainingDetailsView from '@/views/trainings/TrainingDetailsView.vue'
import PersonView from '@/views/PersonView.vue'
import SettingsView from '@/views/SettingsView.vue'

const routes = [
  // Auth Routes (Auth Layout)
  {
    path: '/',
    redirect: '/login', // Anyone visiting root goes to login
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      layout: 'auth',
      redirectIfAuthenticated: true,
    },
  },
  {
    path: '/teams',
    name: 'teams',
    component: TeamsView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/teams/:id',
    name: 'team-detail',
    component: TeamDetailView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/teams/create',
    name: 'team-create',
    component: CreateTeamView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/teams/:id/edit',
    name: 'team-edit',
    component: EditTeamView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/persons',
    name: 'person',
    component: PersonView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/persons/:id/edit',
    name: 'person-edit',
    component: EditPersonView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/trainings/create',
    name: 'training-create',
    component: CreateTrainingView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/teams/:teamId/trainings',
    name: 'trainings',
    component: TeamTrainingsView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/teams/:teamId/trainings/:id',
    name: 'trainings-detail',
    component: TrainingDetailsView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true, layout: 'app' },
  },
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation Guards
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Redirect to login with return URL
    next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
    return
  }

  // Redirect authenticated users away from auth pages
  if (to.meta.redirectIfAuthenticated && auth.isAuthenticated) {
    next({ name: 'teams' })
    return
  }

  // If going to root and authenticated, redirect to teams
  if (to.path === '/' && auth.isAuthenticated) {
    next({ name: 'teams' })
    return
  }

  next()
})

export default router
