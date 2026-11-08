<script setup lang="ts">
import { ref } from "vue";
import GameCanvas from "./components/game/GameCanvas.vue";

const isReady = ref(false);
const errorMessage = ref<string | null>(null);

function handleError(message: string) {
  errorMessage.value = message;
}
</script>

<template>
  <div class="app">
    <div class="canvas">
      <GameCanvas @ready="isReady = true" @error="handleError" />
    </div>

    <header class="topbar">
      <div class="brand">
        <p class="eyebrow">Prototipo 3D para navegador</p>
        <h1>Three Demo</h1>
      </div>
      <span class="badge">Etapa 3 · Física</span>
    </header>

    <p v-if="isReady" class="hint">Arrastra para orbitar · Rueda para acercar</p>

    <div v-if="!isReady && !errorMessage" class="status">
      <span class="spinner" aria-hidden="true" />
      Cargando escena…
    </div>

    <div v-if="errorMessage" class="status status--error">
      No se pudo iniciar la escena 3D: {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  height: 100dvh;
  overflow: hidden;
}

.canvas {
  position: absolute;
  inset: 0;
}

.canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.topbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  pointer-events: none;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.55);
}

.eyebrow {
  color: rgba(214, 226, 247, 0.72);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  color: var(--text-strong);
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}

.badge {
  padding: 0.45rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(11, 18, 36, 0.55);
  backdrop-filter: blur(10px);
  color: var(--text);
  font-size: 0.75rem;
  white-space: nowrap;
}

.hint {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  padding: 0.55rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(11, 18, 36, 0.55);
  backdrop-filter: blur(10px);
  color: var(--text-muted);
  font-size: 0.78rem;
  transform: translateX(-50%);
  pointer-events: none;
  white-space: nowrap;
}

.status {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 1.1rem;
  border: 1px solid var(--border);
  border-radius: 0.7rem;
  background: rgba(11, 18, 36, 0.72);
  backdrop-filter: blur(10px);
  color: var(--text);
  font-size: 0.85rem;
  transform: translate(-50%, -50%);
}

.status--error {
  max-width: min(32rem, calc(100vw - 3rem));
  border-color: rgba(255, 122, 122, 0.4);
  color: #ffd1d1;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .topbar {
    padding: 1rem;
  }

  .badge {
    display: none;
  }
}
</style>
