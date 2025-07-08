<script setup lang="ts">
interface Props {
  lastUpdated: Date | null
}

withDefaults(defineProps<Props>(), {
  lastUpdated: null,
})

defineOptions({
  name: 'AppFooter',
})

const formatLastUpdated = (date: Date): string => {
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `Last updated on ${month} ${day} ${hours}:${minutes}`
}
</script>

<template>
  <footer
    v-if="lastUpdated"
    class="bg-blue-600 text-white text-center py-3 px-4 text-sm font-medium"
  >
    {{ formatLastUpdated(lastUpdated) }}
  </footer>
</template>
