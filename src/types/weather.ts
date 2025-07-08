// OpenWeatherMap Geocoding API Types
export interface GeocodingLocation {
  name: string
  local_names?: Record<string, string>
  lat: number
  lon: number
  country: string
  state?: string
}

export type GeocodingResponse = GeocodingLocation[]

// OpenWeatherMap API Response Types
export interface WeatherCondition {
  id: number
  main: string
  description: string
  icon: string
}

export interface MainWeatherData {
  temp: number
  feels_like: number
  temp_min: number
  temp_max: number
  pressure: number
  humidity: number
}

export interface Wind {
  speed: number
  deg: number
}

export interface Clouds {
  all: number
}

export interface Coord {
  lon: number
  lat: number
}

// Forecast API Response
export interface ForecastItem {
  dt: number
  main: MainWeatherData
  weather: WeatherCondition[]
  clouds: Clouds
  wind: Wind
  visibility: number
  pop: number
  dt_txt: string
}

export interface ForecastResponse {
  cod: string
  message: number
  cnt: number
  list: ForecastItem[]
  city: {
    id: number
    name: string
    coord: Coord
    country: string
    population: number
    timezone: number
    sunrise: number
    sunset: number
  }
}

// App-specific Types for Processed Forecasts
export interface HourlyForecast {
  time: Date
  temperature: number
  feelsLike: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  visibility: number
  precipitationProbability: number
  weather: {
    main: string
    description: string
    icon: string
  }
}

export interface DailyForecast {
  date: Date
  temperatureMin: number
  temperatureMax: number
  humidity: number
  pressure: number
  windSpeed: number
  precipitationProbability: number
  weather: {
    main: string
    description: string
    icon: string
  }
  forecasts: HourlyForecast[]
}

export interface WeatherError {
  message: string
  code?: number
}

export interface WeatherApiResponse {
  hourlyForecast: HourlyForecast[]
  dailyForecast: DailyForecast[]
}

export interface WeatherState {
  data: WeatherApiResponse | null
  loading: boolean
  error: WeatherError | null
  lastUpdated: Date | null
}
