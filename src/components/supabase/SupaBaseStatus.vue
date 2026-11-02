<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { supabase } from '@/config/supabase'

const { t } = useI18n()
const connected = !!supabase
</script>

<template>
  <wa-badge :variant="connected ? 'success' : 'danger'" appearance="outlined">
    {{ t('supabase.clientStatus', { status: t(connected ? 'supabase.initialized' : 'supabase.failed') }) }}
  </wa-badge>
</template>