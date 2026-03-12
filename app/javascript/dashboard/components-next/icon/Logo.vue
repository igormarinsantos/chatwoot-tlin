<script setup>
import { useAttrs } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';

const attrs = useAttrs();
const globalConfig = useMapGetter('globalConfig/get');
</script>

<template>
  <img
    v-if="globalConfig.logoThumbnail"
    v-bind="attrs"
    :src="globalConfig.logoThumbnail"
  />
  <svg
    v-else
    v-once
    v-bind="attrs"
    width="16"
    height="16"
    viewBox="0 0 500 500"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="50" y="50" width="400" height="400" rx="80" fill="#B597FF" opacity="0.1"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="DM Sans" font-weight="900" font-size="300" fill="#B597FF">T</text>
  </svg>
</template>
