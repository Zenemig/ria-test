<script setup lang="ts">
import type { DailyForecast } from '@/types/weather'

interface Props {
  dailyForecast: DailyForecast[]
}

defineProps<Props>()

defineOptions({
  name: 'DailyForecast',
})

const formatDate = (date: Date): string => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow'
  }

  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-800">Next days</h2>
    </div>

    <div v-if="dailyForecast.length > 0" class="space-y-4">
      <div
        v-for="forecast in dailyForecast"
        :key="forecast.date.getTime()"
        class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
      >
        <div class="flex items-center space-x-4 flex-1">
          <img
            :src="`https://openweathermap.org/img/wn/${forecast.weather.icon}@2x.png`"
            :alt="forecast.weather.description"
            class="w-12 h-12 flex-shrink-0"
          />

          <div class="flex-1">
            <div class="font-semibold text-gray-800">
              {{ formatDate(forecast.date) }}
            </div>
            <div class="text-sm text-gray-600 capitalize">
              {{ forecast.weather.description }}
            </div>
          </div>
        </div>

        <div class="text-right">
          <div class="text-lg font-bold text-gray-800">
            {{ forecast.temperatureMax }}°
            <span class="text-gray-500">{{ forecast.temperatureMin }}°</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500">
      <p>No daily forecast available</p>
    </div>
  </div>
</template>
