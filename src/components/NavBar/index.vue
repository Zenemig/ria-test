<script setup lang="ts">
import type { City } from '@/types/city'
import { ref, computed, watch } from 'vue'
import { CITIES, DEFAULT_CITY } from '@/types/city'

defineOptions({
  name: 'CityNavBar',
})

interface Props {
  modelValue?: City
}

interface Emits {
  (e: 'update:modelValue', value: City): void
  (e: 'cityChange', city: City): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => DEFAULT_CITY,
})

const emit = defineEmits<Emits>()

const activeCity = ref<City>(props.modelValue)

const isSameCity = (city1: City, city2: City): boolean => {
  return city1.name === city2.name && city1.country === city2.country
}

const isCityActive = computed(() => (city: City) => {
  return isSameCity(activeCity.value, city)
})

const selectCity = (city: City) => {
  activeCity.value = city
  emit('update:modelValue', city)
  emit('cityChange', city)
}

watch(
  () => props.modelValue,
  (newCity) => {
    if (newCity && !isSameCity(activeCity.value, newCity)) {
      activeCity.value = newCity
    }
  },
  { deep: true },
)
</script>

<template>
  <nav class="bg-white">
    <div class="flex">
      <button
        v-for="city in CITIES"
        :key="`${city.name}-${city.country}`"
        :class="[
          'cursor-pointer flex-1 py-4 px-6 text-sm font-medium tracking-wide transition-all duration-200',
          'hover:bg-gray-50 focus:outline-none',
          isCityActive(city)
            ? 'text-gray-900 border-b-3 border-red-500 bg-gray-50'
            : 'text-gray-500 border-b-3 border-transparent',
        ]"
        @click="selectCity(city)"
        type="button"
      >
        {{ city.name.toUpperCase() }}
      </button>
    </div>
  </nav>
</template>
