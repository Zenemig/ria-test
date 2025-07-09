import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from './index.vue'

describe('AppHeader', () => {
  it('displays the provided title', () => {
    const wrapper = mount(AppHeader, {
      props: { title: 'Weather Dashboard' },
    })

    expect(wrapper.find('h1').text()).toBe('Weather Dashboard')
  })

  it('conditionally renders refresh button based on onRefresh prop', () => {
    // Without onRefresh
    const wrapperWithoutRefresh = mount(AppHeader, {
      props: { title: 'Test Title' },
    })
    expect(wrapperWithoutRefresh.find('button').exists()).toBe(false)

    // With onRefresh
    const mockRefresh = vi.fn()
    const wrapperWithRefresh = mount(AppHeader, {
      props: {
        title: 'Test Title',
        onRefresh: mockRefresh,
      },
    })
    expect(wrapperWithRefresh.find('button').exists()).toBe(true)
  })

  it('handles loading state correctly', async () => {
    const mockRefresh = vi.fn()
    const wrapper = mount(AppHeader, {
      props: {
        title: 'Test Title',
        onRefresh: mockRefresh,
        loading: true,
      },
    })

    // When loading
    const button = wrapper.find('button')
    const icon = wrapper.find('svg')

    expect(button.element.disabled).toBe(true)
    expect(icon.classes()).toContain('animate-spin')
    expect(button.attributes('title')).toBe('Refreshing...')

    // When not loading
    await wrapper.setProps({ loading: false })

    expect(button.element.disabled).toBe(false)
    expect(icon.classes()).not.toContain('animate-spin')
    expect(button.attributes('title')).toBe('Refresh weather data')
  })

  it('calls onRefresh when button is clicked', async () => {
    const mockRefresh = vi.fn()
    const wrapper = mount(AppHeader, {
      props: {
        title: 'Test Title',
        onRefresh: mockRefresh,
      },
    })

    await wrapper.find('button').trigger('click')
    expect(mockRefresh).toHaveBeenCalledOnce()
  })
})
