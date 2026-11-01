<script setup lang="ts">
import { supabase } from '@/config/supabase'

const connected = !!supabase
</script>

<template>
  <div>Supabase client: {{ connected ? 'initialized' : 'failed' }}</div>
</template>