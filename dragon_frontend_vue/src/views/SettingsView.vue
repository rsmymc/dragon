<template>
  <div class="settings-view">
    <div class="construction-container">
      <div class="construction-icon">⚙️</div>
      <h1 class="construction-title">Settings</h1>
      <p class="construction-message">This page is currently under construction</p>
      <div class="construction-details">
        <p>Coming soon:</p>
        <ul>
          <li>User preferences</li>
          <li>Team configuration</li>
          <li>Notification settings</li>
          <li>Data export/import</li>
          <li>Account management</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  mounted() {
    console.log('SettingsView component mounted - Under Construction')
  },
}
</script>

<style scoped>
.settings-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}

.construction-container {
  text-align: center;
  max-width: 500px;
  padding: 3rem 2rem;
  border: 2px dashed #6b7280;
  border-radius: 12px;
  background-color: #f9fafb;
}

.construction-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.construction-title {
  font-size: 2rem;
  font-weight: bold;
  color: #374151;
  margin-bottom: 1rem;
}

.construction-message {
  font-size: 1.2rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.construction-details {
  color: #4b5563;
  text-align: left;
}

.construction-details p {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.construction-details ul {
  margin-left: 1rem;
}

.construction-details li {
  margin-bottom: 0.25rem;
}
</style>
