<script setup>
// This layout is used for login and register pages
// Clean layout - branding is handled in the login form itself
</script>

<template>
  <div class="auth-layout">
    <!-- Main auth content area -->
    <main class="auth-main">
      <slot />
    </main>

    <!-- Optional: Footer -->
    <footer class="auth-footer">
      <p>&copy; {{ new Date().getFullYear() }} DragonBoat Manager. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
/* Using your exact brand colors from colors.xml */
.auth-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #123157 0%, #0b1d33 50%, #194780 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.auth-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 500px;
}

.auth-footer {
  position: absolute;
  bottom: 2rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  text-align: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .auth-layout {
    padding: 1rem;
  }

  .auth-footer {
    position: static;
    margin-top: 2rem;
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .auth-layout {
    padding: 0.5rem;
  }

  .auth-main {
    max-width: 100%;
  }

  .auth-footer {
    font-size: 0.75rem;
  }
}
</style>
