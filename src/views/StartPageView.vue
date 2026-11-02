<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageTitle from '@/components/PageTitle.vue'

const { t } = useI18n()
</script>

<template>
  <section class="page-content start-page">
    <p class="start-page__eyebrow">{{ t('startPage.eyebrow') }}</p>
    <PageTitle class="start-page__title">{{ t('startPage.title') }}</PageTitle>
    <p class="start-page__description">{{ t('startPage.description') }}</p>
    <div class="start-page__links">
      <RouterLink class="start-page__link start-page__link--discussion" to="/discussions">
        {{ t('startPage.discussions') }}
        <span aria-hidden="true">&rarr;</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.start-page {
  padding-block-start: var(--page-title-top-spacing);
  padding-block-end: var(--page-title-top-spacing);
}

.start-page__title {
  max-width: 13ch;
}

.start-page__eyebrow {
  margin: 0 0 1rem;
  line-height: 1.25rem;
  white-space: nowrap;
  color: var(--wa-color-brand-on-normal);
  font-size: var(--wa-font-size-s);
  font-weight: var(--wa-font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.start-page__description {
  max-width: 42rem;
  margin: 1.5rem 0 2rem;
  color: var(--wa-color-text-quiet);
  font-size: clamp(1.125rem, 2vw, 1.35rem);
}

.start-page__link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: var(--wa-border-radius-m);
  background: var(--wa-color-brand-fill-loud);
  color: var(--wa-color-brand-on-loud);
  font-weight: var(--wa-font-weight-semibold);
  padding: 0.85rem 1.25rem;
  text-decoration: none;
}

.start-page__link:hover {
  background: var(--wa-color-brand-fill-normal);
  color: var(--wa-color-brand-on-normal);
}

.start-page__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.start-page__link--discussion {
  border: 1px solid #fff;
  background: #fff;
  color: #1f1f1f;
}

.start-page__link--discussion:hover {
  border-color: #eee;
  background: #eee;
  color: #1f1f1f;
}
</style>
