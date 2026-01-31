<template>
  <q-page class="error-page flex flex-center">
    <div class="error-content text-center">
      <div class="error-icon">
        <q-icon name="sports_soccer" size="80px" color="primary" />
      </div>
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Página no encontrada</h2>
      <p class="error-description">
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </p>
      <div class="error-actions">
        <q-btn
          color="primary"
          label="Volver al inicio"
          icon="home"
          :to="{ name: 'dashboard' }"
          class="q-mr-sm"
        />
        <q-btn
          outline
          color="primary"
          label="Ir atrás"
          icon="arrow_back"
          @click="$router.back()"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// Error page - no additional setup needed
</script>

<style lang="scss" scoped>
.error-page {
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-surface-variant) 100%);
  min-height: 100vh;
}

.error-content {
  max-width: 400px;
  padding: 32px;
}

.error-icon {
  margin-bottom: 24px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.error-code {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 6rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
  margin: 0 0 16px;
  opacity: 0.2;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--color-on-surface);
}

.error-description {
  color: var(--color-on-surface-variant);
  margin: 0 0 32px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
