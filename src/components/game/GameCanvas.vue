<script setup lang="ts">
import { TresCanvas } from "@tresjs/core";
import CameraOrbitControls from "./scene/CameraOrbitControls.vue";
import SceneEnvironment from "./scene/SceneEnvironment.vue";
import SceneWorld from "./scene/SceneWorld.vue";

const emit = defineEmits<{
  ready: [];
  error: [message: string];
}>();

function handleError(error: Error) {
  emit("error", error.message);
}
</script>

<template>
  <TresCanvas
    clear-color="#0b1224"
    :dpr="[1, 2]"
    shadows
    :tone-mapping-exposure="1.2"
    @ready="emit('ready')"
    @error="handleError"
  >
    <TresPerspectiveCamera
      :position="[13, 9, 15]"
      :fov="48"
      :near="0.1"
      :far="220"
      :look-at="[0, 1.2, 0]"
    />

    <CameraOrbitControls />
    <SceneEnvironment />
    <SceneWorld />
  </TresCanvas>
</template>
