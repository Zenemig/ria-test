import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from './index.vue'

describe('AppFooter', () => {
  it('conditionally renders based on lastUpdated prop', () => {
    // When null
    const wrapperWithNull = mount(AppFooter, {
      props: { lastUpdated: null },
    })
    expect(wrapperWithNull.find('footer').exists()).toBe(false)

    // When provided
    const testDate = new Date('2024-01-15T14:30:00')
    const wrapperWithDate = mount(AppFooter, {
      props: { lastUpdated: testDate },
    })
    expect(wrapperWithDate.find('footer').exists()).toBe(true)
  })

  it('formats date correctly and pads hours/minutes', () => {
    const testDate = new Date('2024-01-05T09:05:00')
    const wrapper = mount(AppFooter, {
      props: { lastUpdated: testDate },
    })

    const text = wrapper.text()
    expect(text).toMatch(/^Last updated on \w{3} \d{1,2} \d{2}:\d{2}$/)
    expect(text).toContain('09:05')
  })
})
