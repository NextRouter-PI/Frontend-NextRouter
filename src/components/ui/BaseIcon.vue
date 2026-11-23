<script setup>
import { computed } from 'vue'
import { getIconPath } from '@/utils/icons'

const props = defineProps({
  name: { type: String, required: true },
  spin: { type: Boolean, default: false },
})

const path = computed(() => getIconPath(props.name))
</script>

<template>
  <svg
    v-if="path"
    class="mdi base-icon"
    :class="{ 'mdi-spin': spin }"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path :d="path" fill="currentColor" />
  </svg>
</template>
