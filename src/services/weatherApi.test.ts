import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ForecastResponse, GeocodingResponse } from '@/types/weather'
import type { City } from '@/types/city'

// Mock environment variables
vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-api-key')

// Mock fetch globally
global.fetch = vi.fn()

// Import after setting up environment
import {
  WeatherApiError,
  geocodeCity,
  fetchWeatherDataByCoords,
  fetchWeatherData,
} from './weatherApi'

const mockGeocodingResponse: GeocodingResponse = [
  {
    name: 'Los Angeles',
    lat: 34.0522,
    lon: -118.2437,
    country: 'US',
  },
]

const mockForecastResponse: ForecastResponse = {
  cod: '200',
  message: 0,
  cnt: 2,
  list: [
    {
      dt: 1705334400, // 2024-01-15 12:00:00 UTC
      main: {
        temp: 25.5,
        feels_like: 27.2,
        temp_min: 23.1,
        temp_max: 26.8,
        pressure: 1013,
        humidity: 60,
      },
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d',
        },
      ],
      clouds: { all: 0 },
      wind: { speed: 5.2, deg: 180 },
      visibility: 10000,
      pop: 0.2,
      dt_txt: '2024-01-15 12:00:00',
    },
    {
      dt: 1705345200, // 2024-01-15 15:00:00 UTC
      main: {
        temp: 23.8,
        feels_like: 25.1,
        temp_min: 21.5,
        temp_max: 24.2,
        pressure: 1012,
        humidity: 65,
      },
      weather: [
        {
          id: 801,
          main: 'Clouds',
          description: 'few clouds',
          icon: '02d',
        },
      ],
      clouds: { all: 25 },
      wind: { speed: 7.1, deg: 190 },
      visibility: 9500,
      pop: 0.3,
      dt_txt: '2024-01-15 15:00:00',
    },
  ],
  city: {
    id: 5368361,
    name: 'Los Angeles',
    coord: { lon: -118.2437, lat: 34.0522 },
    country: 'US',
    population: 3971883,
    timezone: -28800, // UTC-8
    sunrise: 1705330524,
    sunset: 1705367891,
  },
}

describe('WeatherApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('WeatherApiError', () => {
    it('creates error with message and optional code', () => {
      const error = new WeatherApiError('Test error', 404)

      expect(error.message).toBe('Test error')
      expect(error.code).toBe(404)
      expect(error.name).toBe('WeatherApiError')
      expect(error).toBeInstanceOf(Error)
    })

    it('creates error without code', () => {
      const error = new WeatherApiError('Test error')

      expect(error.message).toBe('Test error')
      expect(error.code).toBeUndefined()
    })
  })

  describe('geocodeCity', () => {
    it('makes correct API call and returns data', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse,
      } as Response)

      const result = await geocodeCity('Los Angeles', 'US')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('geo/1.0/direct?q=Los%20Angeles%2CUS&limit=5&appid='),
      )
      expect(result).toEqual(mockGeocodingResponse)
    })

    it('handles city name without country code', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse,
      } as Response)

      await geocodeCity('Los Angeles')

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=Los%20Angeles&'))
    })

    it('throws WeatherApiError on API failure', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(geocodeCity('InvalidCity')).rejects.toThrow(WeatherApiError)
      await expect(geocodeCity('InvalidCity')).rejects.toThrow('Failed to geocode city')
    })
  })

  describe('fetchWeatherDataByCoords', () => {
    it('makes correct API call with coordinates', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecastResponse,
      } as Response)

      const result = await fetchWeatherDataByCoords(34.0522, -118.2437)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('forecast?lat=34.0522&lon=-118.2437&appid='),
      )
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('units=metric'))
      expect(result).toEqual(mockForecastResponse)
    })

    it('throws WeatherApiError on API failure', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce(
        new Response('Server error', {
          status: 500,
          statusText: 'Internal Server Error',
        }),
      )

      await expect(fetchWeatherDataByCoords(0, 0)).rejects.toThrow(WeatherApiError)
    })
  })

  describe('fetchWeatherData integration', () => {
    it('orchestrates API calls and transforms data correctly', async () => {
      const mockFetch = vi.mocked(fetch)

      // Mock geocoding response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse,
      } as Response)

      // Mock weather data response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecastResponse,
      } as Response)

      const testCity: City = { name: 'Los Angeles', country: 'US' }
      const result = await fetchWeatherData(testCity)

      // Verify API calls were made in sequence
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('geo/1.0/direct'))
      expect(mockFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('forecast'))

      // Verify data transformation
      expect(result).toHaveProperty('hourlyForecast')
      expect(result).toHaveProperty('dailyForecast')
      expect(Array.isArray(result.hourlyForecast)).toBe(true)
      expect(Array.isArray(result.dailyForecast)).toBe(true)
    })

    it('throws error when no geocoding results found', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      const testCity: City = { name: 'InvalidCity', country: 'XX' }

      await expect(fetchWeatherData(testCity)).rejects.toThrow(WeatherApiError)
    })

    it('transforms temperature values correctly', async () => {
      const mockFetch = vi.mocked(fetch)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecastResponse,
      } as Response)

      const testCity: City = { name: 'Los Angeles', country: 'US' }
      const result = await fetchWeatherData(testCity)

      // Check that temperatures are rounded
      const firstHourly = result.hourlyForecast[0]
      if (firstHourly) {
        expect(Number.isInteger(firstHourly.temperature)).toBe(true)
        expect(Number.isInteger(firstHourly.feelsLike)).toBe(true)
      }
    })

    it('converts precipitation probability to percentage', async () => {
      const mockFetch = vi.mocked(fetch)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocodingResponse,
      } as Response)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecastResponse,
      } as Response)

      const testCity: City = { name: 'Los Angeles', country: 'US' }
      const result = await fetchWeatherData(testCity)

      // Check precipitation probability conversion (0.2 -> 20%)
      const firstHourly = result.hourlyForecast[0]
      if (firstHourly) {
        expect(firstHourly.precipitationProbability).toBe(20)
      }
    })
  })
})
