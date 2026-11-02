<script setup lang="ts">
import { RouterView } from 'vue-router'
import SupaBaseStatus from '@/components/supabase/SupaBaseStatus.vue'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import AuthMenu from '@/components/AuthMenu.vue'
import AppTitle from '@/components/AppTitle.vue'
</script>

<template>
  <wa-page>
    <header slot="header" class="app-header">
      <div class="app-header__brand">
        <AppTitle />
      </div>
      <div class="app-header__actions">
        <AuthMenu />
        <LanguageSwitcher />
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
