<script setup lang="ts">
import type { City } from '@/types/city'
import { ref } from 'vue'
import AppHeader from './components/AppHeader/index.vue'
import CityNavBar from './components/NavBar/index.vue'
import { DEFAULT_CITY_ID } from '@/types/city'

const selectedCity = ref(DEFAULT_CITY_ID)

const handleCityChange = (city: City) => {
  console.log('Selected city:', city)
  // Here you would typically fetch weather data for the selected city
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader title="Simple Weather" />
    <CityNavBar v-model="selectedCity" @city-change="handleCityChange" />

    <!-- Weather content will go here -->
    <main class="container mx-auto p-4">
      <div class="text-center text-gray-600">
        <p>Selected city: {{ selectedCity }}</p>
        <p class="mt-2 text-sm">Weather content will be displayed here</p>
      </div>
    </main>
  </div>
</template>

<style scoped></style>
