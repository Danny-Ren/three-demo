<script setup lang="ts">
import { useLoop, useTresContext } from "@tresjs/core";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { onBeforeUnmount, onMounted } from "vue";

const { camera, renderer } = useTresContext();
const { onBeforeRender } = useLoop();

let controls: OrbitControls | undefined;

onMounted(() => {
  controls = new OrbitControls(camera.activeCamera.value, renderer.instance.domElement);
  controls.target.set(0, 1.2, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 7;
  controls.maxDistance = 34;
  controls.maxPolarAngle = Math.PI / 2 - 0.06;
  controls.update();
});

onBeforeRender(() => {
  controls?.update();
});

onBeforeUnmount(() => {
  controls?.dispose();
  controls = undefined;
});
</script>

<template />
