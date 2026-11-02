<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SupaBaseStatus from '@/components/supabase/SupaBaseStatus.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import AuthMenu from '@/components/AuthMenu.vue'
import AppTitle from '@/components/AppTitle.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const utilitiesMenuOpen = ref(false)
const utilitiesMenuRef = ref<HTMLElement | null>(null)

function closeUtilitiesMenu(): void {
  utilitiesMenuOpen.value = false
}

function handleOutsidePointerDown(event: PointerEvent): void {
  if (event.target instanceof Node && !utilitiesMenuRef.value?.contains(event.target)) {
    closeUtilitiesMenu()
  }
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeUtilitiesMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsidePointerDown)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointerDown)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <wa-page>
    <header slot="header" class="app-header" :class="{ 'app-header--signed-out': !auth.user }">
      <div class="app-header__brand">
        <AppTitle />
      </div>
      <nav
        class="app-header__navigation"
        :aria-label="t('navigation.primaryLabel')"
        @click="closeUtilitiesMenu"
      >
        <RouterLink to="/game">{{ t('navigation.game') }}</RouterLink>
        <RouterLink to="/discussions">{{ t('navigation.discussions') }}</RouterLink>
      </nav>
      <AuthMenu class="app-header__auth" />
      <div ref="utilitiesMenuRef" class="app-header__utilities">
        <button
          type="button"
          class="app-header__menu-toggle"
          :aria-label="t(utilitiesMenuOpen ? 'navigation.closeMenu' : 'navigation.openMenu')"
          aria-controls="app-header-actions"
          :aria-expanded="utilitiesMenuOpen"
          @click="utilitiesMenuOpen = !utilitiesMenuOpen"
        >
          <wa-icon :name="utilitiesMenuOpen ? 'xmark' : 'bars'" aria-hidden="true" />
        </button>
        <div
          id="app-header-actions"
          class="app-header__actions"
          :class="{ 'app-header__actions--open': utilitiesMenuOpen }"
        >
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main id="main-content">
      <RouterView />
    </main>

    <footer v-show="false" slot="main-footer" class="app-footer">
      <SupaBaseStatus />
    </footer>
  </wa-page>
</template>
