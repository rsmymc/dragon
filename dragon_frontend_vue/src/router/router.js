import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import LoginView from '@/views/LoginView.vue'
import TeamsView from '@/views/teams/TeamsView.vue'
import CreateTeamView from '@/views/teams/CreateTeamView.vue'
import EditTeamView from '@/views/teams/EditTeamView.vue'
import TeamLayout from '@/views/teams/TeamLayout.vue'
import TeamMembersView from '@/views/teams/TeamMembersView.vue'
import ProfileView from '@/views/ProfileView.vue'
import TeamTrainingsView from '@/views/trainings/TeamTrainingsView.vue'
import TrainingDetailsView from '@/views/trainings/TrainingDetailsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import RegisterView from '@/views/RegisterView.vue'

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
    path: '/register',
    name: 'register',
    component: RegisterView,
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
    // Static segment first so it wins over the dynamic /teams/:id
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
    // Tabbed team layout: header + Members/Trainings tabs
    path: '/teams/:id',
    component: TeamLayout,
    meta: { requiresAuth: true, layout: 'app' },
    children: [
      {
        path: '', // default tab -> Members
        name: 'team-detail',
        component: TeamMembersView,
        meta: { requiresAuth: true, layout: 'app' },
      },
      {
        path: 'trainings',
        name: 'trainings',
        component: TeamTrainingsView,
        meta: { requiresAuth: true, layout: 'app' },
      },
    ],
  },
  {
    // Training drill-down: full page, no team tabs
    path: '/teams/:teamId/trainings/:id',
    name: 'trainings-detail',
    component: TrainingDetailsView,
    meta: { requiresAuth: true, layout: 'app' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
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
