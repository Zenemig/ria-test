import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NavBar from './index.vue'
import { CITIES, DEFAULT_CITY } from '@/types/city'

describe('NavBar', () => {
  it('renders all cities as buttons', () => {
    const wrapper = mount(NavBar)

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(CITIES.length)

    CITIES.forEach((city, index) => {
      expect(buttons[index].text()).toBe(city.name.toUpperCase())
    })
  })

  it('sets default city as active initially', () => {
    const wrapper = mount(NavBar)

    const defaultCityButton = wrapper
      .findAll('button')
      .find((button) => button.text() === DEFAULT_CITY.name.toUpperCase())

    expect(defaultCityButton?.classes()).toContain('text-gray-900')
    expect(defaultCityButton?.classes()).toContain('border-red-500')
  })

  it('emits events when city is selected', async () => {
    const wrapper = mount(NavBar)
    const beijingButton = wrapper.findAll('button').find((button) => button.text() === 'BEIJING')

    await beijingButton?.trigger('click')

    const beijingCity = CITIES.find((city) => city.name === 'Beijing')
    expect(wrapper.emitted('update:modelValue')).toEqual([[beijingCity]])
    expect(wrapper.emitted('cityChange')).toEqual([[beijingCity]])
  })

  it('updates active city when modelValue prop changes', async () => {
    const wrapper = mount(NavBar, {
      props: { modelValue: DEFAULT_CITY },
    })

    const beijingCity = CITIES.find((city) => city.name === 'Beijing')!
    await wrapper.setProps({ modelValue: beijingCity })

    const beijingButton = wrapper.findAll('button').find((button) => button.text() === 'BEIJING')

    expect(beijingButton?.classes()).toContain('text-gray-900')
    expect(beijingButton?.classes()).toContain('border-red-500')
  })
})
