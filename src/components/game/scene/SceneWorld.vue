<script setup lang="ts">
import { DoubleSide } from "three";

type Vector3 = [number, number, number];

interface Block {
  position: Vector3;
  size: Vector3;
  color: string;
  rotation?: Vector3;
}

interface Pillar {
  position: Vector3;
  radius: number;
  height: number;
  color: string;
}

const platforms: Block[] = [
  { position: [-7, 0.6, -5], size: [7, 1.2, 7], color: "#34476f" },
  { position: [6.5, 1.1, -7], size: [6, 2.2, 6], color: "#3e5488" },
  { position: [0, 0.4, -12], size: [11, 0.8, 4], color: "#2f4066" },
];

const ramps: Block[] = [
  {
    position: [-7, 0.62, 0.2],
    size: [3.2, 0.3, 6],
    color: "#48619a",
    rotation: [0.22, 0, 0],
  },
  {
    position: [6.5, 1.12, -2.6],
    size: [3, 0.3, 5.2],
    color: "#48619a",
    rotation: [0.44, 0, 0],
  },
];

const crates: Block[] = [
  { position: [-3, 0.5, 3], size: [1, 1, 1], color: "#ff9f5a" },
  { position: [-1.6, 0.5, 4.4], size: [1, 1, 1], color: "#4fd1c5" },
  {
    position: [-3.3, 0.5, 4.6],
    size: [0.9, 0.9, 0.9],
    color: "#8b7cf6",
    rotation: [0, 0.5, 0],
  },
  { position: [3, 0.6, 2.2], size: [1.2, 1.2, 1.2], color: "#ff9f5a" },
  { position: [4.6, 0.5, 3.6], size: [1, 1, 1], color: "#4fd1c5" },
  { position: [5.4, 2.7, -6.4], size: [1, 1, 1], color: "#ff9f5a" },
  { position: [-8.4, 1.7, -4.4], size: [1, 1, 1], color: "#8b7cf6" },
];

const walls: Block[] = [
  { position: [-10.5, 0.9, 5.5], size: [4, 1.8, 0.6], color: "#2f4066" },
  { position: [10, 0.6, 1.5], size: [0.6, 1.2, 5], color: "#2f4066" },
];

const pillars: Pillar[] = [
  { position: [-12, 1.6, -1], radius: 0.8, height: 3.2, color: "#4a6190" },
  { position: [12, 1.6, -3], radius: 0.8, height: 3.2, color: "#4a6190" },
  { position: [0, 0.8, 8], radius: 0.6, height: 1.6, color: "#4a6190" },
];
</script>

<template>
  <!-- Terreno -->
  <TresMesh :rotation="[-Math.PI / 2, 0, 0]" receive-shadow>
    <TresPlaneGeometry :args="[80, 80]" />
    <TresMeshStandardMaterial color="#26324c" :roughness="0.95" :metalness="0.05" />
  </TresMesh>

  <TresGridHelper :args="[80, 40, '#40597f', '#2c3d5e']" :position="[0, 0.02, 0]" />

  <!-- Marca de inicio -->
  <TresMesh :position="[0, 0.04, 0]" :rotation="[-Math.PI / 2, 0, 0]">
    <TresRingGeometry :args="[3.8, 4, 64]" />
    <TresMeshBasicMaterial color="#5eead4" :transparent="true" :opacity="0.35" :side="DoubleSide" />
  </TresMesh>

  <!-- Plataformas -->
  <TresMesh
    v-for="platform in platforms"
    :key="`platform-${platform.position.join('-')}`"
    :position="platform.position"
    :rotation="platform.rotation ?? [0, 0, 0]"
    cast-shadow
    receive-shadow
  >
    <TresBoxGeometry :args="platform.size" />
    <TresMeshStandardMaterial :color="platform.color" :roughness="0.8" :metalness="0.1" />
  </TresMesh>

  <!-- Rampas -->
  <TresMesh
    v-for="ramp in ramps"
    :key="`ramp-${ramp.position.join('-')}`"
    :position="ramp.position"
    :rotation="ramp.rotation ?? [0, 0, 0]"
    cast-shadow
    receive-shadow
  >
    <TresBoxGeometry :args="ramp.size" />
    <TresMeshStandardMaterial :color="ramp.color" :roughness="0.75" :metalness="0.12" />
  </TresMesh>

  <!-- Cajas -->
  <TresMesh
    v-for="crate in crates"
    :key="`crate-${crate.position.join('-')}`"
    :position="crate.position"
    :rotation="crate.rotation ?? [0, 0, 0]"
    cast-shadow
    receive-shadow
  >
    <TresBoxGeometry :args="crate.size" />
    <TresMeshStandardMaterial :color="crate.color" :roughness="0.55" :metalness="0.05" />
  </TresMesh>

  <!-- Muros y obstáculos -->
  <TresMesh
    v-for="wall in walls"
    :key="`wall-${wall.position.join('-')}`"
    :position="wall.position"
    cast-shadow
    receive-shadow
  >
    <TresBoxGeometry :args="wall.size" />
    <TresMeshStandardMaterial :color="wall.color" :roughness="0.85" :metalness="0.08" />
  </TresMesh>

  <TresMesh
    v-for="pillar in pillars"
    :key="`pillar-${pillar.position.join('-')}`"
    :position="pillar.position"
    cast-shadow
    receive-shadow
  >
    <TresCylinderGeometry :args="[pillar.radius, pillar.radius, pillar.height, 24]" />
    <TresMeshStandardMaterial :color="pillar.color" :roughness="0.8" :metalness="0.1" />
  </TresMesh>
</template>
