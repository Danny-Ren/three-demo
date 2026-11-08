<script setup lang="ts">
import RAPIER from "@dimforge/rapier3d-compat";
import { useLoop } from "@tresjs/core";
import type { Object3D } from "three";
import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { PhysicsWorld } from "../../../game/physics/PhysicsWorld";
import { crates, ground, pillars, platforms, ramps, walls } from "../../../game/scene/layout";

const crateMeshes: (Object3D | null)[] = [];
const physics = shallowRef<PhysicsWorld | null>(null);
const { onBeforeRender } = useLoop();

let isDisposed = false;

function setCrateRef(index: number, element: unknown) {
  crateMeshes[index] = (element as Object3D | null) ?? null;
}

onMounted(async () => {
  await RAPIER.init();
  if (isDisposed) return;

  const world = new PhysicsWorld();
  world.addStaticGround(ground.size);
  platforms.forEach((platform) => world.addStaticBlock(platform));
  ramps.forEach((ramp) => world.addStaticBlock(ramp));
  walls.forEach((wall) => world.addStaticBlock(wall));
  pillars.forEach((pillar) => world.addStaticPillar(pillar));

  crates.forEach((crate, index) => {
    world.addDynamicBox(crate, crateMeshes[index] ?? undefined);
  });

  physics.value = world;
});

onBeforeRender(({ delta }) => {
  physics.value?.step(delta);
});

onBeforeUnmount(() => {
  isDisposed = true;
  physics.value?.dispose();
  physics.value = null;
});
</script>

<template>
  <TresMesh
    v-for="(crate, index) in crates"
    :key="crate.id"
    :ref="(element) => setCrateRef(index, element)"
    :position="crate.position"
    :rotation="crate.rotation ?? [0, 0, 0]"
    cast-shadow
    receive-shadow
  >
    <TresBoxGeometry :args="crate.size" />
    <TresMeshStandardMaterial :color="crate.color" :roughness="0.55" :metalness="0.05" />
  </TresMesh>
</template>
