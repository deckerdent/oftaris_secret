<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/theme'

const { t } = useI18n()
const { isDarkTheme, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="header-display-control theme-toggle"
    :aria-label="t(isDarkTheme ? 'theme.switchToLight' : 'theme.switchToDark')"
    :title="t(isDarkTheme ? 'theme.switchToLight' : 'theme.switchToDark')"
    @click="toggleTheme"
  >
    <wa-icon :name="isDarkTheme ? 'sun' : 'moon'" aria-hidden="true" />
    <span class="theme-toggle__label">
      {{ t(isDarkTheme ? 'theme.switchToLight' : 'theme.switchToDark') }}
    </span>
  </button>
</template>
