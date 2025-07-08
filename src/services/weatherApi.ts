import type { ForecastResponse, HourlyForecast, DailyForecast, WeatherData } from '@/types/weather'

// API Configuration
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

// Validate API key is available
if (!API_KEY) {
  throw new Error('VITE_OPENWEATHER_API_KEY environment variable is required')
}

// Helper function to handle API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new WeatherApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
    )
  }
  return response.json()
}

// Custom error class for weather API errors
export class WeatherApiError extends Error {
  constructor(
    message: string,
    public code?: number,
  ) {
    super(message)
    this.name = 'WeatherApiError'
  }
}

// Fetch 5-day forecast for a city by ID
export const fetchForecast = async (cityId: number): Promise<ForecastResponse> => {
  const url = `${BASE_URL}/forecast?id=${cityId}&appid=${API_KEY}&units=metric`

  try {
    const response = await fetch(url)
    return await handleApiResponse<ForecastResponse>(response)
  } catch (error) {
    if (error instanceof WeatherApiError) {
      throw error
    }
    throw new WeatherApiError(
      `Failed to fetch forecast: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

// Transform forecast response to hourly forecasts (from next hour)
export const transformHourlyForecast = (response: ForecastResponse): HourlyForecast[] => {
  const now = new Date()
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1)

  // Filter items that are from next hour onwards (up to 24 hours)
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const hourlyItems = response.list.filter((item) => {
    const itemDate = new Date(item.dt * 1000)
    return itemDate >= nextHour && itemDate <= nextDay
  })

  // Transform to our format
  return hourlyItems.map((item) => ({
    time: new Date(item.dt * 1000),
    temperature: Math.round(item.main.temp),
    icon: item.weather[0].icon,
    precipitationChance: Math.round(item.pop * 100),
  }))
}

// Transform forecast response to daily forecasts (starting from tomorrow)
export const transformDailyForecast = (response: ForecastResponse): DailyForecast[] => {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  // Filter items from tomorrow onwards
  const futureItems = response.list.filter((item) => {
    const itemDate = new Date(item.dt * 1000)
    return itemDate >= tomorrow
  })

  // Group forecast items by date
  const dailyGroups = new Map<string, typeof futureItems>()

  futureItems.forEach((item) => {
    const date = new Date(item.dt * 1000)
    const dateKey = date.toDateString()

    if (!dailyGroups.has(dateKey)) {
      dailyGroups.set(dateKey, [])
    }
    dailyGroups.get(dateKey)!.push(item)
  })

  // Convert to daily forecasts (take first 5 days)
  const dailyForecasts: DailyForecast[] = []
  let count = 0

  for (const [dateKey, items] of dailyGroups) {
    if (count >= 5) break

    const date = new Date(dateKey)
    const temps = items.map((item) => item.main.temp)
    const maxTemp = Math.round(Math.max(...temps))
    const minTemp = Math.round(Math.min(...temps))

    // Use weather from the middle of the day (around noon) or first available
    const middayItem =
      items.find((item) => {
        const hour = new Date(item.dt * 1000).getHours()
        return hour >= 12 && hour <= 15
      }) || items[0]

    const weather = middayItem.weather[0]

    dailyForecasts.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      condition: weather.main,
      icon: weather.icon,
      maxTemp,
      minTemp,
    })

    count++
  }

  return dailyForecasts
}

// Main function to fetch and transform all weather data
export const fetchWeatherData = async (cityId: number): Promise<WeatherData> => {
  try {
    const forecastResponse = await fetchForecast(cityId)

    const hourly = transformHourlyForecast(forecastResponse)
    const daily = transformDailyForecast(forecastResponse)

    return {
      hourly,
      daily,
    }
  } catch (error) {
    if (error instanceof WeatherApiError) {
      throw error
    }
    throw new WeatherApiError(
      `Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
