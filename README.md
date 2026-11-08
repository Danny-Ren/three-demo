# Three Demo

Prototipo de videojuego 3D en tercera persona que se ejecuta directamente en el navegador. El objetivo es explorar una arquitectura moderna para desarrollo de juegos web con herramientas de código abierto y publicar una demo interactiva como pieza de portfolio.

> **Estado:** Etapa 2 completada (escena 3D). La física y el personaje controlable se incorporan en las siguientes etapas.

## Stack

| Área               | Tecnología                                 | Licencia   |
| ------------------ | ------------------------------------------ | ---------- |
| Framework          | Vue 3 (Composition API + `<script setup>`) | MIT        |
| Lenguaje           | TypeScript                                 | Apache-2.0 |
| Toolchain          | Vite+ (`vp`)                               | MIT        |
| Renderizado 3D     | Three.js                                   | MIT        |
| Integración 3D/Vue | TresJS                                     | MIT        |
| Física             | Rapier 3D (pendiente, Etapa 3)             | Apache-2.0 |

## Requisitos

- Node.js `24.21.0` (Vite+ admite `^22.18.0 || ^24.11.0 || >=26.0.0`).
- pnpm `12.18.0` (gestionado por `devEngines`; se descarga automáticamente si falta).

## Comandos

```bash
pnpm install      # instalar dependencias
pnpm dev          # servidor de desarrollo
pnpm build        # type-check + build de producción
pnpm preview      # previsualizar el build
pnpm check        # formato, lint y tipos (Vite+)
```

## Controles actuales

- **Arrastrar**: orbitar la cámara alrededor del escenario.
- **Rueda del ratón**: acercar o alejar la cámara.

Estos controles son provisionales para revisar la escena. En la Etapa 4 se sustituyen por una cámara en tercera persona que sigue al personaje.

## Estructura

```text
src/
  components/
    game/
      GameCanvas.vue              # canvas, cámara y composición de la escena
      scene/
        CameraOrbitControls.vue   # órbita provisional (Three.js OrbitControls)
        SceneEnvironment.vue      # cielo, niebla, luces y sombras
        SceneWorld.vue            # terreno, plataformas, rampas, cajas y obstáculos
  App.vue                         # composición de la pantalla y overlay
  main.ts                         # punto de entrada de Vue
  style.css                       # estilos globales y tema base
public/
  favicon.svg
```

La carpeta `src/game/` (motor, jugador, física) se añadirá en las siguientes etapas, manteniendo un único bucle de actualización para render y física.

## Hoja de ruta

- [x] **Etapa 0** — Verificación de entorno, acceso a GitHub y plan.
- [x] **Etapa 1** — Inicialización con Vue 3, TypeScript y Vite+.
- [x] **Etapa 2** — Escena 3D: canvas, cámara, luces, cielo, terreno y geometrías.
- [ ] **Etapa 3** — Física con Rapier: gravedad, colisiones y cajas dinámicas.
- [ ] **Etapa 4** — Personaje controlable y cámara en tercera persona.
- [ ] **Etapa 5** — Interacciones, HUD, FPS y reinicio de escena.
- [ ] **Etapa 6** — Build estático, publicación y documentación final.

## Licencias

El código del proyecto se publicará con una licencia libre. Las dependencias utilizadas son MIT o Apache-2.0; sus atribuciones se documentarán al publicar la demo.
