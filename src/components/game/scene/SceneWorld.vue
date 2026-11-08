<script setup lang="ts">
import { DoubleSide } from "three";
import { ground, pillars, platforms, ramps, walls } from "../../../game/scene/layout";
</script>

<template>
  <!-- Terreno -->
  <TresMesh :rotation="[-Math.PI / 2, 0, 0]" receive-shadow>
    <TresPlaneGeometry :args="ground.size" />
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
    :key="platform.id"
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
    :key="ramp.id"
    :position="ramp.position"
    :rotation="ramp.rotation ?? [0, 0, 0]"
    cast-shadow
    receive-shadow
  >
    <TresBoxGeometry :args="ramp.size" />
    <TresMeshStandardMaterial :color="ramp.color" :roughness="0.75" :metalness="0.12" />
  </TresMesh>

  <!-- Muros y obstáculos -->
  <TresMesh
    v-for="wall in walls"
    :key="wall.id"
    :position="wall.position"
    cast-shadow
    receive-shadow
  >
    <TresBoxGeometry :args="wall.size" />
    <TresMeshStandardMaterial :color="wall.color" :roughness="0.85" :metalness="0.08" />
  </TresMesh>

  <TresMesh
    v-for="pillar in pillars"
    :key="pillar.id"
    :position="pillar.position"
    cast-shadow
    receive-shadow
  >
    <TresCylinderGeometry :args="[pillar.radius, pillar.radius, pillar.height, 24]" />
    <TresMeshStandardMaterial :color="pillar.color" :roughness="0.8" :metalness="0.1" />
  </TresMesh>
</template>
