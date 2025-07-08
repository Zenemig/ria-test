import { reactive, computed, watchEffect, toValue, readonly } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { WeatherState, WeatherApiResponse } from '@/types/weather'
import type { City } from '@/types/city'
import { fetchWeatherData, WeatherApiError } from '@/services/weatherApi'

// Cache for storing weather data to avoid excessive API calls
const weatherCache = new Map<string, { data: WeatherApiResponse; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

const getCacheKey = (city: City): string => `${city.name},${city.country}`

export function useWeather(city: MaybeRefOrGetter<City>) {
  const state = reactive<WeatherState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  })

  const weatherData = computed(() => state.data)
  const isLoading = computed(() => state.loading)
  const error = computed(() => state.error)
  const lastUpdated = computed(() => state.lastUpdated)

  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION
  }

  const clearError = () => {
    state.error = null
  }

  const setError = (error: unknown) => {
    if (error instanceof WeatherApiError) {
      state.error = {
        message: error.message,
        code: error.code,
      }
    } else {
      state.error = {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      }
    }
  }

  const fetchWeather = async (cityData: City): Promise<void> => {
    if (!cityData || !cityData.name || !cityData.country) {
      setError(new Error('Valid city with name and country is required'))
      return
    }

    const cacheKey = getCacheKey(cityData)

    const cached = weatherCache.get(cacheKey)
    if (cached && isCacheValid(cached.timestamp)) {
      state.data = cached.data
      state.lastUpdated = new Date(cached.timestamp)
      clearError()
      return
    }

    state.loading = true
    clearError()

    try {
      const weatherData = await fetchWeatherData(cityData)

      state.data = weatherData
      state.lastUpdated = new Date()

      weatherCache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
      setError(error)
    } finally {
      state.loading = false
    }
  }

  const refreshWeather = async (): Promise<void> => {
    const cityData = toValue(city)
    if (!cityData) return

    const cacheKey = getCacheKey(cityData)

    weatherCache.delete(cacheKey)

    await fetchWeather(cityData)
  }

  const clearCache = () => {
    weatherCache.clear()
  }

  watchEffect(() => {
    const cityData = toValue(city)
    if (cityData && cityData.name && cityData.country) {
      fetchWeather(cityData)
    }
  })

  return {
    // State
    state: readonly(state),

    // Computed properties
    weatherData,
    isLoading,
    error,
    lastUpdated,

    // Functions
    fetchWeather,
    refreshWeather,
    clearError,
    clearCache,
  }
}

export type UseWeatherReturn = ReturnType<typeof useWeather>
