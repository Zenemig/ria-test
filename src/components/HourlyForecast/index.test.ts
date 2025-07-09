import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HourlyForecast from './index.vue'
import type { HourlyForecast as HourlyForecastType } from '@/types/weather'

const mockHourlyForecast: HourlyForecastType[] = [
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
  {
    time: new Date('2024-01-15T15:00:00'),
    temperature: 23,
    feelsLike: 25,
    humidity: 65,
    pressure: 1012,
    windSpeed: 7,
    windDirection: 190,
    visibility: 9500,
    precipitationProbability: 30,
    weather: {
      main: 'Clouds',
      description: 'few clouds',
      icon: '02d',
    },
  },
]

describe('HourlyForecast', () => {
  it('conditionally renders based on hourlyForecast prop', () => {
    // When empty array
    const wrapperEmpty = mount(HourlyForecast, {
      props: { hourlyForecast: [] },
    })
    expect(wrapperEmpty.text()).toContain('No hourly forecast available')
    expect(wrapperEmpty.find('.overflow-x-auto').exists()).toBe(false)

    // When has data
    const wrapperWithData = mount(HourlyForecast, {
      props: { hourlyForecast: mockHourlyForecast },
    })
    expect(wrapperWithData.find('.overflow-x-auto').exists()).toBe(true)
    expect(wrapperWithData.text()).not.toContain('No hourly forecast available')
  })

  it('renders forecast items with correct data', () => {
    const wrapper = mount(HourlyForecast, {
      props: { hourlyForecast: mockHourlyForecast },
    })

    const forecastItems = wrapper.findAll('.flex-shrink-0')
    expect(forecastItems).toHaveLength(mockHourlyForecast.length)

    // Check first forecast item
    const firstItem = forecastItems[0]
    expect(firstItem.text()).toContain('25°')
    expect(firstItem.text()).toContain('20%')

    // Check second forecast item
    const secondItem = forecastItems[1]
    expect(secondItem.text()).toContain('23°')
    expect(secondItem.text()).toContain('30%')
  })

  it('formats time correctly and displays it', () => {
    const wrapper = mount(HourlyForecast, {
      props: { hourlyForecast: mockHourlyForecast },
    })

    // The formatTime function should format the time as 12-hour format
    const timeElements = wrapper.findAll('.text-gray-600')
    expect(timeElements[0].text()).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i)
    expect(timeElements[1].text()).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i)
  })

  it('renders weather icons with correct src and alt attributes', () => {
    const wrapper = mount(HourlyForecast, {
      props: { hourlyForecast: mockHourlyForecast },
    })

    const images = wrapper.findAll('img')
    expect(images).toHaveLength(mockHourlyForecast.length)

    // Check first image
    expect(images[0].attributes('src')).toBe('https://openweathermap.org/img/wn/01d@2x.png')
    expect(images[0].attributes('alt')).toBe('clear sky')

    // Check second image
    expect(images[1].attributes('src')).toBe('https://openweathermap.org/img/wn/02d@2x.png')
    expect(images[1].attributes('alt')).toBe('few clouds')
  })

  it('applies opacity class for items beyond index 7', () => {
    // Create array with 10 items to test the opacity logic
    const manyForecasts = Array.from({ length: 10 }, (_, index) => ({
      ...mockHourlyForecast[0],
      time: new Date(`2024-01-15T${14 + index}:00:00`),
      temperature: 20 + index,
    }))

    const wrapper = mount(HourlyForecast, {
      props: { hourlyForecast: manyForecasts },
    })

    const forecastItems = wrapper.findAll('.flex-shrink-0')

    // Items 0-7 should not have opacity-60 class
    for (let i = 0; i <= 7; i++) {
      expect(forecastItems[i].classes()).not.toContain('opacity-60')
    }

    // Items 8-9 should have opacity-60 class
    for (let i = 8; i < 10; i++) {
      expect(forecastItems[i].classes()).toContain('opacity-60')
    }
  })
})
