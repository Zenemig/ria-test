<script setup lang="ts">
import { ref } from 'vue'
import type { City } from '@/types/city'
import { DEFAULT_CITY } from '@/types/city'
import AppHeader from './components/AppHeader/index.vue'
import CityNavBar from './components/NavBar/index.vue'
import AppFooter from './components/AppFooter/index.vue'
import ErrorMessage from './components/ErrorMessage/index.vue'
import HourlyForecast from './components/HourlyForecast/index.vue'
import DailyForecast from './components/DailyForecast/index.vue'
import { useWeather } from '@/composables/useWeather'

const selectedCity = ref<City>(DEFAULT_CITY)

const { weatherData, isLoading, error, lastUpdated, refreshWeather, clearError } =
  useWeather(selectedCity)

const handleCityChange = (city: City) => {
  selectedCity.value = city
  clearError()
}

const handleRefresh = () => {
  refreshWeather()
}
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <AppHeader title="Simple Weather" :loading="isLoading" :on-refresh="handleRefresh" />
    <CityNavBar v-model="selectedCity" @city-change="handleCityChange" />

    <div class="flex-1 mockup-gradient p-4">
      <ErrorMessage :error="error" :on-clear-error="clearError" />

      <main v-if="weatherData" class="container mx-auto max-w-4xl space-y-6">
        <HourlyForecast :hourly-forecast="weatherData.hourlyForecast" />

        <DailyForecast :daily-forecast="weatherData.dailyForecast" />
      </main>

      <div v-else-if="isLoading && !error" class="container mx-auto max-w-4xl">
        <div class="bg-white rounded-lg shadow-sm p-12 text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
          ></div>
          <p class="text-gray-600">Loading weather data...</p>
        </div>
      </div>

      <div v-else-if="!weatherData && !isLoading && !error" class="container mx-auto max-w-4xl">
        <div class="bg-white rounded-lg shadow-sm p-12 text-center">
          <p class="text-gray-600">Select a city to view weather forecast</p>
        </div>
      </div>
    </div>

    <AppFooter :last-updated="lastUpdated" />
  </div>
</template>

<style scoped>
.mockup-gradient {
  background: linear-gradient(
    to bottom,
    #2563eb 0%,
    #3b82f6 20%,
    #60a5fa 40%,
    #dbeafe 60%,
    #fef3c7 100%
  );
}
</style>
