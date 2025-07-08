<script setup lang="ts">
import type { City } from '@/types/city'
import { ref } from 'vue'
import { CITIES, DEFAULT_CITY_ID } from '@/types/city'

interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'cityChange', city: City): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: DEFAULT_CITY_ID,
})

const emit = defineEmits<Emits>()

const activeCity = ref(props.modelValue)

const selectCity = (city: City) => {
  activeCity.value = city.id
  emit('update:modelValue', city.id)
  emit('cityChange', city)
}
</script>

<template>
  <nav class="bg-white border-b border-gray-200">
    <div class="flex">
      <button
        v-for="city in CITIES"
        :key="city.id"
        :class="[
          'cursor-pointer flex-1 py-4 px-6 text-sm font-medium tracking-wide transition-all duration-200',
          'hover:bg-gray-50 focus:outline-none',
          activeCity === city.id
            ? 'text-gray-900 border-b-2 border-red-500 bg-gray-50'
            : 'text-gray-500 border-b-2 border-transparent',
        ]"
        @click="selectCity(city)"
        type="button"
      >
        {{ city.name.toUpperCase() }}
      </button>
    </div>
  </nav>
</template>

<script lang="ts">
export default {
  name: 'CityNavBar',
}
</script>

<style scoped></style>
