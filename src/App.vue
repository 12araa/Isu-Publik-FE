<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="UserListIsuView">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>

<script setup>
import { RouterView } from 'vue-router'
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  min-height: 100%;
  margin: 0;
}
</style>
