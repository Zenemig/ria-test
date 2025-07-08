<script setup lang="ts">
import {
  // MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  title: string
  loading?: boolean
  onRefresh?: () => void
}

withDefaults(defineProps<Props>(), {
  loading: false,
  onRefresh: undefined,
})
</script>

<template>
  <header class="flex items-center justify-between bg-blue-700 text-white p-4">
    <h1 class="mr-4 text-2xl font-semibold">{{ title }}</h1>

    <div class="flex items-center space-x-3">
      <!-- TODO: Add search functionality -->
      <!-- Search Icon -->
      <!-- <MagnifyingGlassIcon class="h-6 w-6 hover:opacity-75 transition-opacity cursor-pointer" /> -->

      <!-- Refresh Button -->
      <button
        v-if="onRefresh"
        @click="onRefresh"
        :disabled="loading"
        class="p-1 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :title="loading ? 'Refreshing...' : 'Refresh weather data'"
      >
        <ArrowPathIcon :class="['h-6 w-6 transition-transform', loading ? 'animate-spin' : '']" />
      </button>
    </div>
  </header>
</template>

<script lang="ts">
export default {
  name: 'AppHeader',
}
</script>

<style scoped></style>
