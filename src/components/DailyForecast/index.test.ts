import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DailyForecast from './index.vue'
import type { DailyForecast as DailyForecastType } from '@/types/weather'

const mockDailyForecast: DailyForecastType[] = [
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
  {
    date: new Date('2024-01-16T12:00:00'),
    temperatureMin: 16,
    temperatureMax: 25,
    humidity: 65,
    pressure: 1012,
    windSpeed: 7,
    precipitationProbability: 30,
    weather: {
      main: 'Clouds',
      description: 'few clouds',
      icon: '02d',
    },
    forecasts: [],
  },
]

describe('DailyForecast', () => {
  let mockDate: Date

  beforeEach(() => {
    // Mock current date to 2024-01-15 for consistent testing
    mockDate = new Date('2024-01-15T10:00:00')
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('conditionally renders based on dailyForecast prop', () => {
    // When empty array
    const wrapperEmpty = mount(DailyForecast, {
      props: { dailyForecast: [] },
    })
    expect(wrapperEmpty.text()).toContain('No daily forecast available')
    expect(wrapperEmpty.find('.space-y-4').exists()).toBe(false)

    // When has data
    const wrapperWithData = mount(DailyForecast, {
      props: { dailyForecast: mockDailyForecast },
    })
    expect(wrapperWithData.find('.space-y-4').exists()).toBe(true)
    expect(wrapperWithData.text()).not.toContain('No daily forecast available')
  })

  it('renders forecast items with correct data', () => {
    const wrapper = mount(DailyForecast, {
      props: { dailyForecast: mockDailyForecast },
    })

    const forecastItems = wrapper.findAll('.py-3')
    expect(forecastItems).toHaveLength(mockDailyForecast.length)

    // Check first forecast item
    const firstItem = forecastItems[0]
    expect(firstItem.text()).toContain('28°')
    expect(firstItem.text()).toContain('18°')
    expect(firstItem.text()).toContain('clear sky')

    // Check second forecast item
    const secondItem = forecastItems[1]
    expect(secondItem.text()).toContain('25°')
    expect(secondItem.text()).toContain('16°')
    expect(secondItem.text()).toContain('few clouds')
  })

  it('formats dates correctly with formatDate function', () => {
    // Create forecasts for today, tomorrow, and day after
    const todayForecast = {
      ...mockDailyForecast[0],
      date: new Date('2024-01-15T12:00:00'), // Same day as mocked current date
    }
    const tomorrowForecast = {
      ...mockDailyForecast[0],
      date: new Date('2024-01-16T12:00:00'), // Next day
    }
    const dayAfterForecast = {
      ...mockDailyForecast[0],
      date: new Date('2024-01-17T12:00:00'), // Day after tomorrow
    }

    const wrapper = mount(DailyForecast, {
      props: {
        dailyForecast: [todayForecast, tomorrowForecast, dayAfterForecast],
      },
    })

    const forecastItems = wrapper.findAll('.py-3')
    const dateElements = forecastItems.map((item) => item.find('.font-semibold'))
    expect(dateElements[0].text()).toBe('Today')
    expect(dateElements[1].text()).toBe('Tomorrow')
    expect(dateElements[2].text()).toMatch(/^\w{3}, \w{3} \d{1,2}$/) // Format like "Wed, Jan 17"
  })

  it('renders weather icons with correct src and alt attributes', () => {
    const wrapper = mount(DailyForecast, {
      props: { dailyForecast: mockDailyForecast },
    })

    const images = wrapper.findAll('img')
    expect(images).toHaveLength(mockDailyForecast.length)

    // Check first image
    expect(images[0].attributes('src')).toBe('https://openweathermap.org/img/wn/01d@2x.png')
    expect(images[0].attributes('alt')).toBe('clear sky')

    // Check second image
    expect(images[1].attributes('src')).toBe('https://openweathermap.org/img/wn/02d@2x.png')
    expect(images[1].attributes('alt')).toBe('few clouds')
  })

  it('capitalizes weather descriptions correctly', () => {
    const forecastWithLowercase = [
      {
        ...mockDailyForecast[0],
        weather: {
          main: 'Rain',
          description: 'light rain',
          icon: '10d',
        },
      },
    ]

    const wrapper = mount(DailyForecast, {
      props: { dailyForecast: forecastWithLowercase },
    })

    const descriptionElement = wrapper.find('.text-sm.text-gray-600')
    expect(descriptionElement.classes()).toContain('capitalize')
    expect(descriptionElement.text()).toBe('light rain')
  })
})
