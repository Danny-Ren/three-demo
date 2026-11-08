<script setup lang="ts">
const stage = "Etapa 1 · Inicialización";
</script>

<template>
  <main class="shell">
    <header class="hero">
      <p class="eyebrow">Prototipo 3D para navegador</p>
      <h1>Three Demo</h1>
      <p class="lead">
        Escenario 3D en tercera persona con física en tiempo real. Construido con Vue 3, TresJS,
        Three.js y Rapier.
      </p>

      <div class="actions">
        <button class="primary" type="button" disabled>Escena en preparación</button>
        <span class="badge">{{ stage }}</span>
      </div>
    </header>

    <footer class="footer">
      <span>Vue 3 · TypeScript · Vite+</span>
      <span>Three.js · TresJS · Rapier</span>
    </footer>
  </main>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 3rem;
  min-height: 100vh;
  max-width: 60rem;
  margin: 0 auto;
  padding: 4rem 1.5rem 2rem;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin: auto 0;
  text-align: center;
}

.eyebrow {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  color: var(--text-strong);
  font-size: clamp(3rem, 12vw, 6.5rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 0.95;
}

.lead {
  max-width: 34rem;
  color: var(--text);
  font-size: clamp(1rem, 2.5vw, 1.2rem);
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.primary {
  padding: 0.7rem 1.4rem;
  border: 1px solid transparent;
  border-radius: 0.6rem;
  background: linear-gradient(180deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-weight: 600;
  cursor: not-allowed;
  opacity: 0.55;
}

.badge {
  padding: 0.7rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.8rem;
}
</style>
