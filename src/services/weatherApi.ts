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

const getTodaysHourlyForecast = (
  forecasts: HourlyForecast[],
  timezoneOffset: number,
): HourlyForecast[] => {
  const utcNow = new Date()
  const localNow = new Date(utcNow.getTime() + timezoneOffset * 1000)

  const todayStart = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1)

  return forecasts.filter((forecast) => {
    const forecastTime = forecast.time
    return forecastTime >= localNow && forecastTime <= todayEnd
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
    const allHourlyForecasts = weatherData.list.map((item) =>
      convertToHourlyForecast(item, timezoneOffset),
    )

    const todaysHourlyForecast = getTodaysHourlyForecast(allHourlyForecasts, timezoneOffset)

    const dailyForecast = groupForecastsByDay(allHourlyForecasts)

    return {
      hourlyForecast: todaysHourlyForecast,
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
