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
    <aside class="start-page__preview" :aria-label="t('startPage.previewTitle')" role="note">
      <wa-icon name="circle-info" aria-hidden="true" />
      <div>
        <p class="start-page__preview-title">{{ t('startPage.previewTitle') }}</p>
        <p class="start-page__preview-message">{{ t('startPage.previewNotice') }}</p>
      </div>
    </aside>
    <div class="start-page__links">
      <RouterLink class="start-page__link" to="/game">
        {{ t('startPage.game') }}
        <span aria-hidden="true">&rarr;</span>
      </RouterLink>
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
  margin: 0 0 var(--page-title-eyebrow-gap);
  line-height: var(--page-title-eyebrow-height);
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

.start-page__preview {
  display: flex;
  width: min(100%, 42rem);
  align-items: flex-start;
  gap: 0.75rem;
  margin-block-end: 1.5rem;
  border: 1px solid color-mix(in srgb, var(--wa-color-focus) 60%, var(--wa-color-surface-border));
  border-radius: var(--wa-border-radius-l);
  background: color-mix(in srgb, var(--wa-color-surface-raised) 90%, transparent);
  padding: 1rem 1.15rem;
  box-shadow: var(--wa-shadow-s);
}

.start-page__preview wa-icon {
  flex: none;
  margin-block-start: 0.15rem;
  color: var(--wa-color-brand-on-normal);
  font-size: 1.15rem;
}

.start-page__preview-title,
.start-page__preview-message {
  margin: 0;
}

.start-page__preview-title {
  font-weight: var(--wa-font-weight-semibold);
}

.start-page__preview-message {
  color: var(--wa-color-text-quiet);
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
