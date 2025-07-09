import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useWeather } from './useWeather'
import type { City } from '@/types/city'
import type { WeatherApiResponse } from '@/types/weather'

// Mock the weatherApi service
vi.mock('@/services/weatherApi', () => ({
  fetchWeatherData: vi.fn(),
  WeatherApiError: class WeatherApiError extends Error {
    public code?: number
    constructor(message: string, code?: number) {
      super(message)
      this.name = 'WeatherApiError'
      this.code = code
    }
  },
}))

const { fetchWeatherData, WeatherApiError } = await import('@/services/weatherApi')

const mockWeatherResponse: WeatherApiResponse = {
  hourlyForecast: [
    {
      time: new Date('2024-01-15T14:00:00'),
      temperature: 25,
      feelsLike: 27,
      humidity: 60,
      pressure: 1013,
      windSpeed: 5,
      windDirection: 180,
      visibility: 10000,
      precipitationProbability: 20,
      weather: {
        main: 'Clear',
        description: 'clear sky',
        icon: '01d',
      },
    },
  ],
  dailyForecast: [
    {
      date: new Date('2024-01-15T12:00:00'),
      temperatureMin: 18,
      temperatureMax: 28,
      humidity: 60,
      pressure: 1013,
      windSpeed: 5,
      precipitationProbability: 20,
      weather: {
        main: 'Clear',
        description: 'clear sky',
        icon: '01d',
      },
      forecasts: [],
    },
  ],
}

const testCities = {
  la: { name: 'Los Angeles', country: 'US' },
  nyc: { name: 'New York', country: 'US' },
  beijing: { name: 'Beijing', country: 'CN' },
  paris: { name: 'Paris', country: 'FR' },
  tokyo: { name: 'Tokyo', country: 'JP' },
  london: { name: 'London', country: 'GB' },
  sydney: { name: 'Sydney', country: 'AU' },
  moscow: { name: 'Moscow', country: 'RU' },
  mumbai: { name: 'Mumbai', country: 'IN' },
  cairo: { name: 'Cairo', country: 'EG' },
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('initializes with correct default state', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    mockFetch.mockResolvedValue(mockWeatherResponse)

    const cityRef = ref(testCities.la)
    const { state, weatherData, isLoading, error, lastUpdated } = useWeather(cityRef)

    // Initial state before watchEffect runs
    expect(weatherData.value).toBeNull()
    expect(error.value).toBeNull()
    expect(lastUpdated.value).toBeNull()

    // Wait for watchEffect to complete
    await nextTick()
    await vi.runAllTimersAsync()

    // After successful fetch
    expect(state.loading).toBe(false)
    expect(isLoading.value).toBe(false)
  })

  it('fetches weather data successfully and updates state', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    mockFetch.mockResolvedValue(mockWeatherResponse)

    const cityRef = ref(testCities.nyc)
    const { state, weatherData, lastUpdated, clearCache } = useWeather(cityRef)

    // Clear cache to ensure fresh fetch
    clearCache()

    // Wait for watchEffect to trigger
    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledWith(testCities.nyc)
    expect(state.loading).toBe(false)
    expect(weatherData.value).toEqual(mockWeatherResponse)
    expect(lastUpdated.value).toBeInstanceOf(Date)
    expect(state.error).toBeNull()
  })

  it('handles WeatherApiError correctly', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    const apiError = new WeatherApiError('API rate limit exceeded', 429)
    mockFetch.mockRejectedValue(apiError)

    const cityRef = ref(testCities.beijing)
    const { state, error, clearCache } = useWeather(cityRef)

    clearCache()

    await nextTick()
    await vi.runAllTimersAsync()

    expect(state.loading).toBe(false)
    expect(error.value).toEqual({
      message: 'API rate limit exceeded',
      code: 429,
    })
    expect(state.data).toBeNull()
  })

  it('handles generic errors correctly', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    mockFetch.mockRejectedValue(new Error('Network error'))

    const cityRef = ref(testCities.paris)
    const { state, error, clearCache } = useWeather(cityRef)

    clearCache()

    await nextTick()
    await vi.runAllTimersAsync()

    expect(error.value).toEqual({
      message: 'Network error',
    })
    expect(state.data).toBeNull()
  })

  it('clears error when clearError is called', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    mockFetch.mockRejectedValue(new Error('Test error'))

    const cityRef = ref(testCities.tokyo)
    const { error, clearError, clearCache } = useWeather(cityRef)

    clearCache()

    await nextTick()
    await vi.runAllTimersAsync()

    expect(error.value).toBeTruthy()

    clearError()
    expect(error.value).toBeNull()
  })

  it('uses cache when data is fresh', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    mockFetch.mockResolvedValue(mockWeatherResponse)

    const cityRef = ref(testCities.london)
    const { clearCache } = useWeather(cityRef)
    clearCache()

    // First call should fetch from API
    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Second call with same city should use cache
    const weather2 = useWeather(cityRef)
    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledTimes(1) // Still only 1 call
    expect(weather2.weatherData.value).toEqual(mockWeatherResponse)
  })

  it('ignores cache when data is stale', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    mockFetch.mockResolvedValue(mockWeatherResponse)

    const cityRef = ref(testCities.sydney)
    const { clearCache } = useWeather(cityRef)
    clearCache()

    // First fetch
    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Advance time by more than cache duration (10 minutes)
    vi.advanceTimersByTime(11 * 60 * 1000)

    // Second call with same city should fetch again due to stale cache
    useWeather(cityRef)

    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledTimes(2) // Should fetch again
  })

  it('refreshes weather data and clears cache', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    mockFetch.mockResolvedValue(mockWeatherResponse)

    const cityRef = ref(testCities.moscow)
    const { refreshWeather, clearCache } = useWeather(cityRef)
    clearCache()

    // Initial fetch
    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Refresh should clear cache and fetch again
    await refreshWeather()

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('reactively updates when city changes', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)
    mockFetch.mockResolvedValue(mockWeatherResponse)

    const cityRef = ref(testCities.mumbai)
    const { clearCache } = useWeather(cityRef)
    clearCache()

    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledWith(testCities.mumbai)

    // Change city
    const newCity: City = { name: 'Beijing', country: 'CN' }
    cityRef.value = newCity

    await nextTick()
    await vi.runAllTimersAsync()

    expect(mockFetch).toHaveBeenCalledWith(newCity)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('validates city input', async () => {
    const mockFetch = vi.mocked(fetchWeatherData)

    const invalidCity = { name: '', country: 'US' } as City
    const cityRef = ref(invalidCity)
    const { error, fetchWeather } = useWeather(cityRef)

    await fetchWeather(invalidCity)

    expect(mockFetch).not.toHaveBeenCalled()
    expect(error.value).toEqual({
      message: 'Valid city with name and country is required',
    })
  })
})
