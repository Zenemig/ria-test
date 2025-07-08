<script setup lang="ts">
import { ref } from 'vue'
import type { City } from '@/types/city'
import { DEFAULT_CITY_ID } from '@/types/city'
import AppHeader from './components/AppHeader/index.vue'
import CityNavBar from './components/NavBar/index.vue'
import AppFooter from './components/AppFooter/index.vue'
import ErrorMessage from './components/ErrorMessage/index.vue'
import { useWeather } from '@/composables/useWeather'

const selectedCityId = ref(DEFAULT_CITY_ID)

// Use the weather composable with city ID
const { hourlyForecast, dailyForecast, isLoading, error, lastUpdated, refreshWeather, clearError } =
  useWeather(selectedCityId)

const handleCityChange = (city: City) => {
  selectedCityId.value = city.id
  clearError()
}

const handleRefresh = () => {
  refreshWeather()
}
</script>

<template>
  <div class="min-h-screen">
    <AppHeader title="Simple Weather" :loading="isLoading" :on-refresh="handleRefresh" />
    <CityNavBar v-model="selectedCityId" @city-change="handleCityChange" />

    <!-- Main content with gradient background matching mockup -->
    <div class="min-h-screen mockup-gradient p-4">
      <!-- Error display -->
      <ErrorMessage :error="error" :on-clear-error="clearError" />

      <!-- Weather content -->
      <main class="container mx-auto space-y-6">
        <pre>{{ hourlyForecast }}</pre>
        <pre>{{ dailyForecast }}</pre>
      </main>
    </div>
    <!-- Last Updated Footer -->
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
