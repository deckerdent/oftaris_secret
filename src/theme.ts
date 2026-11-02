export function applySystemTheme(): void {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')

  function applyTheme(): void {
    const isDark = systemTheme.matches
    document.documentElement.classList.toggle('wa-dark', isDark)
    document.documentElement.classList.toggle('wa-light', !isDark)
  }

  applyTheme()
  systemTheme.addEventListener('change', applyTheme)
}
