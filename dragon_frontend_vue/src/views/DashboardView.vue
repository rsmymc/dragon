<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Sample data - in real app, this would come from API
const stats = ref({
  totalProjects: 24,
  activeProjects: 8,
  completedTasks: 156,
  teamMembers: 12
})

const recentProjects = ref([
  {
    id: 1,
    name: 'E-commerce Platform',
    progress: 75,
    status: 'In Progress',
    dueDate: '2024-03-15',
    team: 4
  },
  {
    id: 2,
    name: 'Mobile App Redesign',
    progress: 45,
    status: 'In Progress',
    dueDate: '2024-04-20',
    team: 3
  },
  {
    id: 3,
    name: 'API Integration',
    progress: 100,
    status: 'Completed',
    dueDate: '2024-02-28',
    team: 2
  },
  {
    id: 4,
    name: 'Dashboard Analytics',
    progress: 20,
    status: 'Planning',
    dueDate: '2024-05-10',
    team: 5
  }
])

const recentActivity = ref([
  {
    id: 1,
    user: 'John Doe',
    action: 'completed task',
    target: 'User Authentication',
    time: '2 hours ago',
    type: 'task'
  },
  {
    id: 2,
    user: 'Sarah Wilson',
    action: 'created project',
    target: 'New Landing Page',
    time: '4 hours ago',
    type: 'project'
  },
  {
    id: 3,
    user: 'Mike Johnson',
    action: 'updated',
    target: 'Database Schema',
    time: '6 hours ago',
    type: 'update'
  },
  {
    id: 4,
    user: 'Emily Chen',
    action: 'commented on',
    target: 'Bug Report #123',
    time: '8 hours ago',
    type: 'comment'
  }
])

// Computed properties
const currentUser = computed(() => auth.user)
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

// Methods
const getStatusColor = (status) => {
  switch (status) {
    case 'Completed': return 'text-green-600 bg-green-100'
    case 'In Progress': return 'text-blue-600 bg-blue-100'
    case 'Planning': return 'text-yellow-600 bg-yellow-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

const getActivityIcon = (type) => {
  switch (type) {
    case 'task':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'project':
      return 'M12 6v6m0 0v6m0-6h6m-6 0H6'
    case 'update':
      return 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    case 'comment':
      return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

// Lifecycle
onMounted(() => {
  // In real app, fetch dashboard data here
  console.log('Dashboard mounted for user:', currentUser.value?.name)
})
</script>

<template>
  <div class="dashboard">
    <!-- Welcome Header -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">
          {{ greeting }}, {{ currentUser?.name || 'User' }}! 👋
        </h1>
        <p class="welcome-subtitle">
          Here's what's happening with your projects today.
        </p>
      </div>
      <div class="welcome-actions">
        <RouterLink to="/projects" class="btn-primary">
          <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Project
        </RouterLink>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalProjects }}</div>
          <div class="stat-label">Total Projects</div>
        </div>
        <div class="stat-icon projects">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.activeProjects }}</div>
          <div class="stat-label">Active Projects</div>
        </div>
        <div class="stat-icon active">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.completedTasks }}</div>
          <div class="stat-label">Completed Tasks</div>
        </div>
        <div class="stat-icon tasks">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.teamMembers }}</div>
          <div class="stat-label">Team Members</div>
        </div>
        <div class="stat-icon team">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Recent Projects -->
      <div class="content-section">
        <div class="section-header">
          <h2 class="section-title">Recent Projects</h2>
          <RouterLink to="/projects" class="section-link">View All</RouterLink>
        </div>
        <div class="projects-list">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="project-card"
          >
            <div class="project-header">
              <h3 class="project-name">{{ project.name }}</h3>
              <span class="project-status" :class="getStatusColor(project.status)">
                {{ project.status }}
              </span>
            </div>
            <div class="project-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: project.progress + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ project.progress }}%</span>
            </div>
            <div class="project-meta">
              <span class="project-due">Due: {{ project.dueDate }}</span>
              <span class="project-team">{{ project.team }} members</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="content-section">
        <div class="section-header">
          <h2 class="section-title">Recent Activity</h2>
          <RouterLink to="/activity" class="section-link">View All</RouterLink>
        </div>
        <div class="activity-list">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getActivityIcon(activity.type)" />
              </svg>
            </div>
            <div class="activity-content">
              <p class="activity-text">
                <span class="activity-user">{{ activity.user }}</span>
                {{ activity.action }}
                <span class="activity-target">{{ activity.target }}</span>
              </p>
              <span class="activity-time">{{ activity.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

/* Welcome Section */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  color: white;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  font-size: 1.125rem;
  opacity: 0.9;
}

.welcome-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.btn-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin-top: 0.5rem;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-icon.projects {
  background: #dbeafe;
  color: #3b82f6;
}

.stat-icon.active {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.tasks {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.team {
  background: #e0e7ff;
  color: #7c3aed;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.content-section {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.section-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.section-link:hover {
  color: #1d4ed8;
}

/* Projects List */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.project-card {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.project-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.project-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.project-status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.project-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  min-width: 3rem;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.activity-icon {
  width: 2rem;
  height: 2rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon svg {
  width: 1rem;
  height: 1rem;
  color: #6b7280;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

.activity-user {
  font-weight: 600;
  color: #1f2937;
}

.activity-target {
  font-weight: 500;
  color: #3b82f6;
}

.activity-time {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-number {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 0 0.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .content-section {
    padding: 1rem;
  }
}
</style>
