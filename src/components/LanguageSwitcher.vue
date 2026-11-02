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
    <button
      slot="trigger"
      type="button"
      class="header-display-control language-switcher__button"
      :aria-label="t('language.label')"
    >
      <wa-icon name="globe" aria-hidden="true" />
      <span class="language-switcher__label">{{ t('language.label') }}</span>
    </button>
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
