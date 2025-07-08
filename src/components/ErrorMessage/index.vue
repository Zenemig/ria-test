<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineOptions({
  name: 'ErrorMessage',
})

interface Props {
  error?: {
    message: string
  } | null
  onClearError: () => void
}

defineProps<Props>()
</script>

<template>
  <div v-if="error" class="bg-red-300 text-red-700 px-4 py-3 pt-4 rounded">
    <div class="flex justify-between items-start">
      <span>{{ error.message }}</span>
      <button
        @click="onClearError"
        class="flex items-center gap-2 hover:bg-red-200 rounded-full p-1 cursor-pointer transition-all duration-200 text-red-800"
      >
        <XMarkIcon class="ml-6 h-4 w-4" />
      </button>
    </div>
  </div>
</template>
