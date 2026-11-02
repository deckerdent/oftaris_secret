<script setup lang="ts">
import logoUrl from '@/assets/logo.png'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
</script>

<template>
  <RouterLink to="/" class="app-title" :aria-label="t('app.title')">
    <img class="app-title__logo" :src="logoUrl" alt="" />
    <span class="app-title__text">{{ t('app.title') }}</span>
  </RouterLink>
</template>

<style scoped>
.app-title {
  --app-logo-size: 15rem;
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding-inline-start: var(--app-logo-size);
  color: var(--wa-color-text-normal);
  text-decoration: none;
  white-space: nowrap;
}

.app-title__logo {
  display: block;
  position: absolute;
  z-index: 1;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: var(--app-logo-size);
  height: var(--app-logo-size);
  object-fit: contain;
  pointer-events: none;
}

.app-title__text {
  font-size: 1.25rem;
  font-weight: var(--wa-font-weight-bold);
}

@media (max-width: 960px) {
  .app-title {
    --app-logo-size: 8rem;
  }
}

@media (max-width: 420px) {
  .app-title {
    --app-logo-size: 4rem;
  }

  .app-title__text {
    font-size: var(--wa-font-size-s);
  }
}
</style>
