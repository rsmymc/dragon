<template>
  <div class="person-view">
    <div class="construction-container">
      <div class="construction-icon">
        🚧
      </div>
      <h1 class="construction-title">
        Person Management
      </h1>
      <p class="construction-message">
        This page is currently under construction
      </p>
      <div class="construction-details">
        <p>Coming soon:</p>
        <ul>
          <li>View person profiles</li>
          <li>Edit personal information</li>
          <li>Manage team memberships</li>
          <li>Track player statistics</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PersonView',
  mounted() {
    console.log('PersonView component mounted - Under Construction')
  }
}
</script>

<style scoped>
.person-view {
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
  border: 2px dashed #fbbf24;
  border-radius: 12px;
  background-color: #fffbeb;
}

.construction-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.construction-title {
  font-size: 2rem;
  font-weight: bold;
  color: #92400e;
  margin-bottom: 1rem;
}

.construction-message {
  font-size: 1.2rem;
  color: #b45309;
  margin-bottom: 2rem;
}

.construction-details {
  color: #92400e;
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
