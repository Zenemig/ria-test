import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorMessage from './index.vue'

describe('ErrorMessage', () => {
  it('conditionally renders based on error prop', () => {
    const mockClearError = vi.fn()

    // When error is null
    const wrapperWithNull = mount(ErrorMessage, {
      props: {
        error: null,
        onClearError: mockClearError,
      },
    })
    expect(wrapperWithNull.find('div').exists()).toBe(false)

    // When error is undefined
    const wrapperWithUndefined = mount(ErrorMessage, {
      props: {
        onClearError: mockClearError,
      },
    })
    expect(wrapperWithUndefined.find('div').exists()).toBe(false)

    // When error is provided
    const wrapperWithError = mount(ErrorMessage, {
      props: {
        error: { message: 'Something went wrong' },
        onClearError: mockClearError,
      },
    })
    expect(wrapperWithError.find('div').exists()).toBe(true)
  })

  it('displays error message correctly', () => {
    const mockClearError = vi.fn()
    const errorMessage = 'Network connection failed'

    const wrapper = mount(ErrorMessage, {
      props: {
        error: { message: errorMessage },
        onClearError: mockClearError,
      },
    })

    expect(wrapper.text()).toContain(errorMessage)
    expect(wrapper.find('span').text()).toBe(errorMessage)
  })

  it('calls onClearError when close button is clicked', async () => {
    const mockClearError = vi.fn()

    const wrapper = mount(ErrorMessage, {
      props: {
        error: { message: 'Test error' },
        onClearError: mockClearError,
      },
    })

    await wrapper.find('button').trigger('click')
    expect(mockClearError).toHaveBeenCalledOnce()
  })
})
