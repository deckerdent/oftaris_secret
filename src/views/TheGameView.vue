<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PageTitle from '@/components/PageTitle.vue'
import naziPhotoUrl from '@/assets/nazi_photo.jpg'

const { t } = useI18n()
</script>

<template>
  <section class="page-content page-content--after-eyebrow game-page">
    <PageTitle>{{ t('gamePage.title') }}</PageTitle>

    <div class="game-page__content">
      <p class="game-page__intro">{{ t('gamePage.intro') }}</p>

      <section class="game-page__section">
        <h2>{{ t('gamePage.historyTitle') }}</h2>
        <p>{{ t('gamePage.historyRoman') }}</p>
        <p>{{ t('gamePage.historyFrankish') }}</p>
        <p>{{ t('gamePage.historyRecord') }}</p>
        <p>
          {{ t('gamePage.historyLinkIntro') }}
          <a href="https://www.oftersheim.de/" target="_blank" rel="noopener noreferrer">
            {{ t('gamePage.historyLink') }}
          </a>.
        </p>
      </section>

      <section class="game-page__section">
        <h2>{{ t('gamePage.legendTitle') }}</h2>
        <p class="game-page__disclaimer">{{ t('gamePage.legendDisclaimer') }}</p>
        <p>{{ t('gamePage.legendDiscovery') }}</p>
        <p>{{ t('gamePage.legendOrder') }}</p>
        <p>{{ t('gamePage.legendWartimeLead') }}</p>
        <figure class="game-page__photo">
          <img :src="naziPhotoUrl" :alt="t('gamePage.photoAlt')" loading="lazy" />
          <figcaption>{{ t('gamePage.photoCaption') }}</figcaption>
        </figure>
        <p>{{ t('gamePage.legendWartimeDetail') }}</p>
      </section>

      <section class="game-page__section">
        <h2>{{ t('gamePage.playTitle') }}</h2>
        <p>{{ t('gamePage.playDescription') }}</p>
        <p>{{ t('gamePage.playStartingPoint') }}</p>
        <h3>{{ t('gamePage.rulesTitle') }}</h3>
        <ul>
          <li>{{ t('gamePage.ruleOne') }}</li>
          <li>{{ t('gamePage.ruleTwo') }}</li>
          <li>{{ t('gamePage.ruleThree') }}</li>
          <li>{{ t('gamePage.ruleFour') }}</li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style scoped>
.game-page {
  padding-block-end: clamp(2rem, 7vw, 4rem);
}

.game-page__content {
  width: min(100%, 52rem);
  margin: 2rem auto 0;
  color: var(--wa-color-text-normal);
  font-size: var(--wa-font-size-m);
  line-height: 1.7;
}

.game-page__intro {
  color: var(--wa-color-text-quiet);
  font-size: clamp(1.125rem, 2vw, 1.35rem);
}

.game-page__section {
  margin-block-start: 2.25rem;
}

.game-page__section h2,
.game-page__section h3 {
  color: var(--wa-color-brand-on-normal);
  font-family: var(--wa-font-family-heading);
  line-height: 1.2;
}

.game-page__section h2 {
  margin-block: 0 0.75rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.game-page__section h3 {
  margin-block: 1.5rem 0.5rem;
  font-size: var(--wa-font-size-l);
}

.game-page__section p {
  margin-block: 0 1rem;
}

.game-page__disclaimer {
  border-inline-start: 3px solid var(--wa-color-focus);
  padding-inline-start: 1rem;
  color: var(--wa-color-text-quiet);
  font-style: italic;
}

.game-page__photo {
  width: min(100%, 34rem);
  margin: 1.5rem auto;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-l);
  background: color-mix(in srgb, var(--wa-color-surface-raised) 90%, transparent);
  padding: 0.75rem;
  box-shadow: var(--wa-shadow-s);
}

.game-page__photo img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--wa-border-radius-m);
}

.game-page__photo figcaption {
  margin-block-start: 0.6rem;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
  line-height: 1.5;
}

.game-page__section ul {
  display: grid;
  gap: 0.6rem;
  padding-inline-start: 1.5rem;
}

.game-page__section a {
  color: var(--wa-color-brand-on-normal);
  text-underline-offset: 0.15em;
}
</style>
