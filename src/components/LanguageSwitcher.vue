<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { localeOptions, setLocale, type Locale } from '@/i18n'

const { t, locale } = useI18n()

function changeLocale(selectedLocale: Locale): void {
  setLocale(selectedLocale)
}
</script>

<template>
  <wa-dropdown placement="bottom-end">
    <wa-button
      slot="trigger"
      appearance="plain"
      size="s"
      :aria-label="t('language.label')"
    >
      <wa-icon name="globe" aria-hidden="true" />
      <span class="language-switcher__label">{{ t('language.label') }}</span>
    </wa-button>
    <wa-dropdown-item
      v-for="option in localeOptions"
      :key="option.value"
      :value="option.value"
      @click="changeLocale(option.value)"
    >
      {{ option.label }}
    </wa-dropdown-item>
  </wa-dropdown>
</template>

<style scoped>
wa-button::part(base) {
  font-size: 1.25rem;
  min-height: 2.5rem;
  min-width: 2.5rem;
}
</style>
