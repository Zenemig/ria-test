<script setup lang="ts">
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

interface Props {
  title: string
}

defineProps<Props>()
</script>

<template>
  <header class="flex items-center justify-between bg-blue-700 text-white p-4">
    <h1 class="mr-4 text-2xl font-semibold">{{ title }}</h1>
    <MagnifyingGlassIcon class="h-6 w-6 hover:opacity-75 transition-opacity cursor-pointer" />
  </header>
</template>

<script lang="ts">
export default {
  name: 'AppHeader',
}
</script>

<style scoped></style>
