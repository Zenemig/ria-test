<script setup lang="ts">
import type { HourlyForecast } from '@/types/weather'

interface Props {
  hourlyForecast: HourlyForecast[]
}

defineProps<Props>()

defineOptions({
  name: 'HourlyForecast',
})

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-800">Next hours</h2>
    </div>

    <div v-if="hourlyForecast.length > 0" class="relative">
      <div class="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
        <div
          v-for="(forecast, index) in hourlyForecast"
          :key="forecast.time.getTime()"
          class="flex-shrink-0 flex flex-col items-center text-center"
          :class="[
            'min-w-[100px]',
            { 'opacity-60': index > 7 }, // Fade out forecasts beyond 8 hours
          ]"
        >
          <div class="text-3xl font-bold text-gray-800 mb-2">{{ forecast.temperature }}°</div>

          <div class="text-sm text-blue-400 font-medium mb-4">
            {{ forecast.precipitationProbability }}%
          </div>

          <div class="mb-4">
            <img
              :src="`https://openweathermap.org/img/wn/${forecast.weather.icon}@2x.png`"
              :alt="forecast.weather.description"
              class="w-16 h-16"
            />
          </div>

          <div class="text-sm text-gray-600 font-medium">
            {{ formatTime(forecast.time) }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <p class="text-lg font-medium">No hourly forecast available</p>
      <p class="text-sm mt-2">Weather data may not be available for the next few hours</p>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.fade-out {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}
</style>
