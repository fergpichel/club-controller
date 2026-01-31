<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="auth-page">
        <!-- Background -->
        <div class="auth-background">
          <div class="bg-gradient"></div>
          <div class="bg-grid"></div>
          <div class="bg-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
          </div>
        </div>

        <!-- Content -->
        <div class="auth-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="page-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Auth layout
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.auth-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0A2540 0%, #0D3251 40%, #1A3A5C 70%, #0A2540 100%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.8), transparent 70%);
}

.bg-shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;

  .shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
  }

  .shape-1 {
    width: 600px;
    height: 600px;
    background: rgba(99, 91, 255, 0.3);
    top: -200px;
    right: -200px;
    animation: float 30s ease-in-out infinite;
  }

  .shape-2 {
    width: 400px;
    height: 400px;
    background: rgba(0, 212, 170, 0.2);
    bottom: -100px;
    left: -100px;
    animation: float 25s ease-in-out infinite reverse;
  }

  .shape-3 {
    width: 300px;
    height: 300px;
    background: rgba(255, 84, 112, 0.15);
    top: 40%;
    left: 50%;
    animation: pulse-float 20s ease-in-out infinite;
  }

  .shape-4 {
    width: 200px;
    height: 200px;
    background: rgba(255, 181, 69, 0.15);
    bottom: 20%;
    right: 20%;
    animation: float 22s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(30px, -30px);
  }
  50% {
    transform: translate(-20px, 40px);
  }
  75% {
    transform: translate(40px, 20px);
  }
}

@keyframes pulse-float {
  0%, 100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.15;
  }
  50% {
    transform: scale(1.2) translate(-30px, -20px);
    opacity: 0.25;
  }
}

.auth-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

// Transitions
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
