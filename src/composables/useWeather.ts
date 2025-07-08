import { reactive, computed, watchEffect, toValue, readonly } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import type { WeatherState, WeatherData } from '@/types/weather'
import { fetchWeatherData, WeatherApiError } from '@/services/weatherApi'

// Cache for storing weather data to avoid excessive API calls
const weatherCache = new Map<number, { data: WeatherData; timestamp: number }>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export function useWeather(cityId: MaybeRefOrGetter<number>) {
  // Reactive state
  const state = reactive<WeatherState>({
    data: {
      hourly: [],
      daily: [],
    },
    loading: false,
    error: null,
    lastUpdated: null,
  })

  // Computed properties for easier access
  const hourlyForecast = computed(() => state.data.hourly)
  const dailyForecast = computed(() => state.data.daily)
  const isLoading = computed(() => state.loading)
  const error = computed(() => state.error)
  const lastUpdated = computed(() => state.lastUpdated)

  // Helper function to check if cached data is still valid
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION
  }

  // Helper function to clear error state
  const clearError = () => {
    state.error = null
  }

  // Helper function to set error state
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

  // Function to fetch weather data for a city ID
  const fetchWeather = async (id: number): Promise<void> => {
    if (!id || id <= 0) {
      setError(new Error('Valid city ID is required'))
      return
    }

    // Check cache first
    const cached = weatherCache.get(id)
    if (cached && isCacheValid(cached.timestamp)) {
      state.data = cached.data
      state.lastUpdated = new Date(cached.timestamp)
      clearError()
      return
    }

    // Set loading state
    state.loading = true
    clearError()

    try {
      // Fetch fresh data
      const weatherData = await fetchWeatherData(id)

      // Update state
      state.data = weatherData
      state.lastUpdated = new Date()

      // Cache the data
      weatherCache.set(id, {
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

  // Function to refresh weather data (bypass cache)
  const refreshWeather = async (): Promise<void> => {
    const id = toValue(cityId)
    if (!id) return

    // Remove from cache to force fresh fetch
    weatherCache.delete(id)

    await fetchWeather(id)
  }

  // Function to clear all cached data
  const clearCache = () => {
    weatherCache.clear()
  }

  // Watch for city ID changes and automatically fetch weather data
  watchEffect(() => {
    const id = toValue(cityId)
    if (id && id > 0) {
      fetchWeather(id)
    }
  })

  // Return reactive state and functions
  return {
    // State
    state: readonly(state),

    // Computed properties
    hourlyForecast,
    dailyForecast,
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

// Export types for better TypeScript support
export type UseWeatherReturn = ReturnType<typeof useWeather>
