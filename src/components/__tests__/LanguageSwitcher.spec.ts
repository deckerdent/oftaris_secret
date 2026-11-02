import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LanguageSwitcher from '../LanguageSwitcher.vue'
import { i18n, localeStorageKey, setLocale } from '@/i18n'

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    setLocale('en')
  })

  it('updates the active locale and persists the selection', async () => {
    const wrapper = mount(LanguageSwitcher, {
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.get('wa-dropdown-item[value="de"]').trigger('click')

    expect(i18n.global.locale.value).toBe('de')
    expect(localStorage.getItem(localeStorageKey)).toBe('de')
    expect(wrapper.text()).toContain('Deutsch')
    expect(i18n.global.t('navigation.start')).toBe('Start')
  })
})
