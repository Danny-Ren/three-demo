<script setup lang="ts">
import { BackSide, CanvasTexture, SRGBColorSpace } from "three";
import type { DirectionalLight } from "three";
import { onBeforeUnmount, onMounted, ref } from "vue";

function createSkyTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 256;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo crear el contexto 2D para el cielo");
  }

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#050a17");
  gradient.addColorStop(0.45, "#122346");
  gradient.addColorStop(0.75, "#2d4f7c");
  gradient.addColorStop(1, "#8fb6d4");

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const skyTexture = createSkyTexture();
const sunRef = ref<DirectionalLight>();

onMounted(() => {
  const sun = sunRef.value;
  if (!sun) return;

  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.camera.updateProjectionMatrix();
});

onBeforeUnmount(() => {
  skyTexture.dispose();
});
</script>

<template>
  <TresFog :args="['#22395f', 32, 95]" />

  <TresMesh :render-order="-1">
    <TresSphereGeometry :args="[120, 32, 16]" />
    <TresMeshBasicMaterial :map="skyTexture" :side="BackSide" :depth-write="false" :fog="false" />
  </TresMesh>

  <TresHemisphereLight :args="['#a8d0ff', '#2b3448', 1.15]" />

  <TresDirectionalLight
    ref="sunRef"
    :position="[16, 22, 12]"
    :intensity="3"
    color="#fff1da"
    cast-shadow
  />

  <TresDirectionalLight :position="[-14, 8, -10]" :intensity="0.8" color="#5f8dff" />

  <TresPointLight
    :position="[-8, 4, 8]"
    :intensity="40"
    :distance="22"
    :decay="2"
    color="#ff9f6e"
  />
</template>
