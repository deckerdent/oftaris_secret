<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { postDiscussionComment } from '@/services/discussions'

const props = defineProps<{
  parentCommentId: string
}>()

const emit = defineEmits<{
  posted: []
}>()

const { t } = useI18n()
const body = ref('')
const isPosting = ref(false)
const hasError = ref(false)

async function submit(): Promise<void> {
  const content = body.value.trim()
  if (!content || isPosting.value) {
    return
  }

  isPosting.value = true
  hasError.value = false

  try {
    await postDiscussionComment(props.parentCommentId, content)
    body.value = ''
    emit('posted')
  } catch {
    hasError.value = true
  } finally {
    isPosting.value = false
  }
}
</script>

<template>
  <form class="reply-composer" @submit.prevent="submit">
    <label class="reply-composer__label">
      {{ t('discussions.writeComment') }}
      <textarea v-model="body" rows="3" required :disabled="isPosting" />
    </label>
    <p v-if="hasError" class="reply-composer__error" role="alert">
      {{ t('discussions.commentError') }}
    </p>
    <button class="reply-composer__submit" type="submit" :disabled="!body.trim() || isPosting">
      {{ isPosting ? t('discussions.posting') : t('discussions.submitComment') }}
    </button>
  </form>
</template>

<style scoped>
.reply-composer {
  display: grid;
  gap: 0.75rem;
}

.reply-composer__label {
  display: grid;
  gap: 0.4rem;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
  font-weight: var(--wa-font-weight-semibold);
}

textarea {
  width: 100%;
  min-height: 5rem;
  resize: vertical;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-m);
  color: var(--wa-color-text-normal);
  background: var(--wa-color-surface-default);
  font: inherit;
  padding: 0.75rem;
}

textarea:focus-visible {
  outline: var(--wa-focus-ring);
  outline-offset: var(--wa-focus-ring-offset);
}

.reply-composer__submit {
  justify-self: start;
  border: 0;
  border-radius: var(--wa-border-radius-m);
  color: var(--wa-color-brand-on-loud);
  background: var(--wa-color-brand-fill-loud);
  font: inherit;
  font-weight: var(--wa-font-weight-semibold);
  padding: 0.65rem 1rem;
  cursor: pointer;
}

.reply-composer__submit:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.reply-composer__error {
  margin: 0;
  color: var(--wa-color-danger-on-normal);
}
</style>
