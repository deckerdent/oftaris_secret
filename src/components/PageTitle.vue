<template>
  <h1 class="page-title">
    <slot />
  </h1>
</template>

<style scoped>
.page-title {
  margin: 0;
  color: var(--wa-color-text-normal);
  font-family: var(--wa-font-family-heading);
  font-size: clamp(2.5rem, 7vw, 5rem);
  font-weight: var(--wa-font-weight-bold);
  letter-spacing: -0.04em;
  line-height: 1.05;
}
</style>
