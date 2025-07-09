import type {
  ForecastResponse,
  GeocodingResponse,
  HourlyForecast,
  DailyForecast,
  WeatherApiResponse,
  ForecastItem,
} from '@/types/weather'
import type { City } from '@/types/city'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'
const GEO_URL = 'https://api.openweathermap.org/geo/1.0'

if (!API_KEY) {
  throw new Error(
    'OpenWeatherMap API key is required. Please set VITE_OPENWEATHER_API_KEY environment variable.',
  )
}

export class WeatherApiError extends Error {
  public code?: number

  constructor(message: string, code?: number) {
    super(message)
    this.name = 'WeatherApiError'
    this.code = code
  }
}

const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text()
    throw new WeatherApiError(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
      response.status,
    )
  }

  try {
    return await response.json()
  } catch (error) {
    throw new WeatherApiError(
      `Failed to parse API response: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Linear interpolation between two values
 */
const linearInterpolate = (value1: number, value2: number, factor: number): number => {
  return value1 + (value2 - value1) * factor
}

/**
 * Circular interpolation for wind direction (handles 360° wrap-around)
 */
const interpolateWindDirection = (dir1: number, dir2: number, factor: number): number => {
  // Normalize directions to 0-360
  const normDir1 = ((dir1 % 360) + 360) % 360
  const normDir2 = ((dir2 % 360) + 360) % 360

  // Calculate the shortest angular distance
  let diff = normDir2 - normDir1
  if (diff > 180) {
    diff -= 360
  } else if (diff < -180) {
    diff += 360
  }

  const result = normDir1 + diff * factor
  return ((result % 360) + 360) % 360
}

/**
 * Interpolate between two hourly forecast points
 */
const interpolateForecast = (
  forecast1: HourlyForecast,
  forecast2: HourlyForecast,
  targetTime: Date,
): HourlyForecast => {
  const time1 = forecast1.time.getTime()
  const time2 = forecast2.time.getTime()
  const targetTimestamp = targetTime.getTime()

  // Calculate interpolation factor (0 = forecast1, 1 = forecast2)
  const factor = (targetTimestamp - time1) / (time2 - time1)

  return {
    time: targetTime,
    temperature: Math.round(
      linearInterpolate(forecast1.temperature, forecast2.temperature, factor),
    ),
    feelsLike: Math.round(linearInterpolate(forecast1.feelsLike, forecast2.feelsLike, factor)),
    humidity: Math.round(linearInterpolate(forecast1.humidity, forecast2.humidity, factor)),
    pressure: Math.round(linearInterpolate(forecast1.pressure, forecast2.pressure, factor)),
    windSpeed:
      Math.round(linearInterpolate(forecast1.windSpeed, forecast2.windSpeed, factor) * 10) / 10,
    windDirection: Math.round(
      interpolateWindDirection(forecast1.windDirection, forecast2.windDirection, factor),
    ),
    visibility: Math.round(linearInterpolate(forecast1.visibility, forecast2.visibility, factor)),
    precipitationProbability: Math.round(
      linearInterpolate(
        forecast1.precipitationProbability,
        forecast2.precipitationProbability,
        factor,
      ),
    ),
    // For weather conditions, use the closer forecast point
    weather: factor < 0.5 ? forecast1.weather : forecast2.weather,
  }
}

/**
 * Create hourly interpolated forecasts from 3-hour interval data
 */
const createHourlyInterpolatedForecasts = (forecasts: HourlyForecast[]): HourlyForecast[] => {
  if (forecasts.length < 2) {
    return forecasts
  }

  const interpolatedForecasts: HourlyForecast[] = []

  for (let i = 0; i < forecasts.length - 1; i++) {
    const current = forecasts[i]
    const next = forecasts[i + 1]

    // Add the current forecast
    interpolatedForecasts.push(current)

    // Calculate time difference in hours
    const timeDiffMs = next.time.getTime() - current.time.getTime()
    const hoursDiff = timeDiffMs / (1000 * 60 * 60)

    // Only interpolate if there's more than 1 hour gap
    if (hoursDiff > 1) {
      const hoursToInterpolate = Math.floor(hoursDiff) - 1

      for (let h = 1; h <= hoursToInterpolate; h++) {
        const interpolatedTime = new Date(current.time.getTime() + h * 60 * 60 * 1000)
        const interpolatedForecast = interpolateForecast(current, next, interpolatedTime)
        interpolatedForecasts.push(interpolatedForecast)
      }
    }
  }

  // Add the last forecast
  interpolatedForecasts.push(forecasts[forecasts.length - 1])

  return interpolatedForecasts
}

export const geocodeCity = async (
  cityName: string,
  countryCode?: string,
): Promise<GeocodingResponse> => {
  const query = countryCode ? `${cityName},${countryCode}` : cityName
  const url = `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`

  try {
    const response = await fetch(url)
    return await handleApiResponse<GeocodingResponse>(response)
  } catch (error) {
    if (error instanceof WeatherApiError) {
      throw error
    }
    throw new WeatherApiError(
      `Failed to geocode city: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export const fetchWeatherDataByCoords = async (
  lat: number,
  lon: number,
): Promise<ForecastResponse> => {
  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`

  try {
    const response = await fetch(url)
    return await handleApiResponse<ForecastResponse>(response)
  } catch (error) {
    if (error instanceof WeatherApiError) {
      throw error
    }
    throw new WeatherApiError(
      `Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

const convertToHourlyForecast = (item: ForecastItem, timezoneOffset: number): HourlyForecast => {
  const utcTime = new Date(item.dt * 1000)
  const localTime = new Date(utcTime.getTime() + timezoneOffset * 1000)

  return {
    time: localTime,
    temperature: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    humidity: item.main.humidity,
    pressure: item.main.pressure,
    windSpeed: item.wind.speed,
    windDirection: item.wind.deg,
    visibility: item.visibility,
    precipitationProbability: Math.round(item.pop * 100),
    weather: {
      main: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
    },
  }
}

const getNext12HoursForecast = (
  forecasts: HourlyForecast[],
  timezoneOffset: number,
): HourlyForecast[] => {
  const utcNow = new Date()
  const localNow = new Date(utcNow.getTime() + timezoneOffset * 1000)

  // Calculate 12 hours from now
  const next12Hours = new Date(localNow.getTime() + 12 * 60 * 60 * 1000)

  return forecasts.filter((forecast) => {
    const forecastTime = forecast.time
    return forecastTime >= localNow && forecastTime <= next12Hours
  })
}

const groupForecastsByDay = (forecasts: HourlyForecast[]): DailyForecast[] => {
  const groupedByDay = forecasts.reduce(
    (acc, forecast) => {
      const dateKey = forecast.time.toDateString()
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(forecast)
      return acc
    },
    {} as Record<string, HourlyForecast[]>,
  )

  return Object.entries(groupedByDay)
    .map(([dateKey, dayForecasts]) => {
      const temperatures = dayForecasts.map((f) => f.temperature)
      const humidities = dayForecasts.map((f) => f.humidity)
      const pressures = dayForecasts.map((f) => f.pressure)
      const windSpeeds = dayForecasts.map((f) => f.windSpeed)
      const precipitationProbs = dayForecasts.map((f) => f.precipitationProbability)

      const weatherCounts = dayForecasts.reduce(
        (acc, forecast) => {
          const key = forecast.weather.main
          acc[key] = (acc[key] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const mostCommonWeather = Object.entries(weatherCounts).reduce((a, b) =>
        weatherCounts[a[0]] > weatherCounts[b[0]] ? a : b,
      )[0]

      const representativeWeather =
        dayForecasts.find((f) => f.weather.main === mostCommonWeather)?.weather ||
        dayForecasts[0].weather

      return {
        date: new Date(dateKey),
        temperatureMin: Math.min(...temperatures),
        temperatureMax: Math.max(...temperatures),
        humidity: Math.round(humidities.reduce((sum, h) => sum + h, 0) / humidities.length),
        pressure: Math.round(pressures.reduce((sum, p) => sum + p, 0) / pressures.length),
        windSpeed:
          Math.round((windSpeeds.reduce((sum, w) => sum + w, 0) / windSpeeds.length) * 10) / 10,
        precipitationProbability: Math.max(...precipitationProbs),
        weather: representativeWeather,
        forecasts: dayForecasts,
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export const fetchWeatherData = async (city: City): Promise<WeatherApiResponse> => {
  try {
    const geocodingResult = await geocodeCity(city.name, city.country)

    if (geocodingResult.length === 0) {
      throw new WeatherApiError(`No location found for: ${city.name}, ${city.country}`)
    }

    const location = geocodingResult[0]

    const weatherData = await fetchWeatherDataByCoords(location.lat, location.lon)

    const timezoneOffset = weatherData.city.timezone

    // Convert raw forecast items to hourly forecasts
    const rawHourlyForecasts = weatherData.list.map((item) =>
      convertToHourlyForecast(item, timezoneOffset),
    )

    // Create interpolated hourly forecasts from 3-hour data
    const allHourlyForecasts = createHourlyInterpolatedForecasts(rawHourlyForecasts)

    const next12HoursForecast = getNext12HoursForecast(allHourlyForecasts, timezoneOffset)

    const dailyForecast = groupForecastsByDay(allHourlyForecasts)

    return {
      hourlyForecast: next12HoursForecast,
      dailyForecast,
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
