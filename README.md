# Simple Weather App

A Vue 3 weather application that displays weather forecasts for multiple cities using the OpenWeatherMap API.

## Features

- 📱 **Three City Tabs**: Pre-configured cities (Rio de Janeiro, Beijing, Los Angeles)
- 🌤️ **Hourly Forecast**: Shows weather for the next hours
- 📅 **5-Day Forecast**: Extended weather forecast
- 🔄 **Refresh Data**: Ability to refresh weather information
- 🔍 **City Search**: Search for additional cities (bonus feature)

## API Configuration

This project uses the [OpenWeatherMap API](https://openweathermap.org/api) for weather data:

- **Plan**: Free subscription
- **Documentation**: https://openweathermap.org/api
- **Weather Icons**: https://openweathermap.org/weather-conditions

## Environment Setup

### 1. Create Environment File

Copy the example environment file:

```sh
cp .env.example .env
```

### 2. Configure API Key

Get your API key from [OpenWeatherMap](https://openweathermap.org/api) and update the `.env` file:

```env
VITE_OPENWEATHER_API_KEY=your_actual_api_key_here
```

⚠️ **Important**: Never commit the `.env` file to version control. It's already included in `.gitignore`.

## Tech Stack

- **Framework**: Vue 3 with TypeScript
- **Build Tool**: Vite 7.0
- **Styling**: Tailwind CSS
- **Testing**: Vitest (unit tests)
- **Code Quality**: ESLint + Prettier

## Development Setup

```sh
# Install dependencies
npm install

# Create environment file from example
cp .env.example .env

# Add your OpenWeatherMap API key to .env file
# VITE_OPENWEATHER_API_KEY=your_api_key_here

# Start development server
npm run dev

# Build for production
npm run build

# Run unit tests
npm run test:unit

# Lint and format code
npm run lint
npm run format
```

## Project Structure

```
src/
├── assets/
│   └── main.css          # Tailwind CSS imports
├── components/           # Weather app components
├── services/             # API service layer
├── composables/          # Vue composables for state management
├── types/                # TypeScript type definitions
├── App.vue               # Main app template with basic layout
└── main.ts               # App entry point
```
