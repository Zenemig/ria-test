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
  pop: number // Probability of precipitation
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

// App-specific Transformed Types
export interface HourlyForecast {
  time: Date
  temperature: number
  icon: string
  precipitationChance: number
}

export interface DailyForecast {
  date: Date
  dayName: string
  condition: string
  icon: string
  maxTemp: number
  minTemp: number
}

export interface WeatherData {
  hourly: HourlyForecast[]
  daily: DailyForecast[]
}

export interface WeatherError {
  message: string
  code?: number
}

export interface WeatherState {
  data: WeatherData
  loading: boolean
  error: WeatherError | null
  lastUpdated: Date | null
}
