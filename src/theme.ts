import { readonly, ref } from 'vue'

export const themeStorageKey = 'oftaris-secret-theme'

type ThemePreference = 'light' | 'dark'

const isDarkTheme = ref(false)

function getSavedThemePreference(): ThemePreference | null {
  const preference = window.localStorage.getItem(themeStorageKey)
  return preference === 'light' || preference === 'dark' ? preference : null
}

function applyTheme(isDark: boolean): void {
  isDarkTheme.value = isDark
  document.documentElement.classList.toggle('wa-dark', isDark)
  document.documentElement.classList.toggle('wa-light', !isDark)
}

export function toggleTheme(): void {
  const nextTheme = isDarkTheme.value ? 'light' : 'dark'
  window.localStorage.setItem(themeStorageKey, nextTheme)
  applyTheme(nextTheme === 'dark')
}

export function useTheme() {
  return {
    isDarkTheme: readonly(isDarkTheme),
    toggleTheme,
  }
}

export function applySystemTheme(): void {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
  const applyPreferredTheme = (): void => {
    const savedPreference = getSavedThemePreference()
    applyTheme(savedPreference ? savedPreference === 'dark' : systemTheme.matches)
  }

  applyPreferredTheme()
  systemTheme.addEventListener('change', () => {
    if (!getSavedThemePreference()) {
      applyTheme(systemTheme.matches)
    }
  })
}
