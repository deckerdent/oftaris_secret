<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import {
  formatDiscussionDateTime,
  loadDiscussionThread,
  type CommentNode,
} from '@/services/discussions'
import CommentNodeView from '@/components/discussions/CommentNode.vue'
import ReactionControl from '@/components/discussions/ReactionControl.vue'
import ReplyComposer from '@/components/discussions/ReplyComposer.vue'

const props = defineProps<{
  threadId: string
}>()

const { t, locale } = useI18n()
const auth = useAuthStore()
const thread = ref<CommentNode | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const displayBody = computed(() => {
  if (!thread.value) {
    return ''
  }
  return thread.value.deleted_at ? t('discussions.deleted') : thread.value.body
})
const createdAt = computed(() =>
  thread.value ? formatDiscussionDateTime(thread.value.created_at, locale.value) : '',
)

async function load(): Promise<void> {
  isLoading.value = true
  hasError.value = false

  try {
    thread.value = await loadDiscussionThread(props.threadId)
  } catch {
    thread.value = null
    hasError.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void load()
})

watch(
  () => props.threadId,
  () => void load(),
)
</script>

<template>
  <section class="thread-page">
    <RouterLink class="thread-page__back" to="/discussions">
      <wa-icon name="chevron-left" library="system" aria-hidden="true" />
      {{ t('discussions.backToDiscussions') }}
    </RouterLink>

    <p v-if="isLoading" class="thread-page__status" role="status">
      {{ t('discussions.loading') }}
    </p>
    <div v-else-if="hasError || !thread" class="thread-page__status" role="alert">
      <p>{{ t('discussions.threadError') }}</p>
      <button type="button" class="thread-page__retry" @click="load">
        {{ t('discussions.retry') }}
      </button>
    </div>

    <template v-else>
      <article class="thread-card">
        <p class="thread-card__body">{{ displayBody }}</p>
        <footer class="thread-card__footer">
          <time :datetime="thread.created_at">{{ createdAt }}</time>
          <ReactionControl
            target="thread"
            :target-id="thread.id"
            :score="thread.reactionScore"
            :my-reaction="thread.myReaction"
            :can-react="Boolean(auth.user)"
            :disabled="Boolean(thread.deleted_at)"
          />
        </footer>
      </article>

      <section class="thread-comments" :aria-label="t('discussions.commentsTitle')">
        <h1>{{ t('discussions.commentsTitle') }}</h1>
        <p v-if="thread.children.length === 0" class="thread-comments__empty">
          {{ t('discussions.noComments') }}
        </p>
        <div v-else class="thread-comments__list">
          <CommentNodeView
            v-for="comment in thread.children"
            :key="comment.id"
            :comment="comment"
            @posted="load"
          />
        </div>
        <ReplyComposer
          v-if="auth.user && !thread.deleted_at"
          :parent-comment-id="thread.id"
          @posted="load"
        />
        <p v-else-if="!auth.user" class="thread-comments__sign-in">
          {{ t('discussions.signInToComment') }}
        </p>
      </section>
    </template>
  </section>
</template>

<style scoped>
.thread-page {
  width: min(100% - 2rem, 52rem);
  margin: 0 auto;
  padding-block: 1.5rem clamp(2rem, 7vw, 4rem);
}

.thread-page__back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-block-end: 1.25rem;
  color: var(--wa-color-brand-on-normal);
  text-decoration: none;
}

.thread-page__back wa-icon {
  width: 1rem;
  height: 1rem;
}

.thread-page__status {
  display: grid;
  justify-items: start;
  gap: 0.75rem;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-l);
  color: var(--wa-color-text-quiet);
  padding: 1.5rem;
}

.thread-page__retry {
  border: 0;
  color: var(--wa-color-brand-on-normal);
  background: transparent;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.thread-card {
  width: min(100%, 48rem);
  margin-inline: auto;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-l);
  background: var(--wa-color-surface-default);
  padding: clamp(1.25rem, 4vw, 2rem);
  box-shadow: var(--wa-shadow-m);
}

.thread-card__body {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.thread-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-block-start: 1rem;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
}

.thread-comments {
  width: min(100%, 48rem);
  margin: 1.5rem auto 0;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-l);
  background: var(--wa-color-surface-default);
  padding: clamp(1rem, 4vw, 1.5rem);
}

.thread-comments h1 {
  margin: 0;
  font-size: var(--wa-font-size-xl);
}

.thread-comments__empty,
.thread-comments__sign-in {
  color: var(--wa-color-text-quiet);
}

.thread-comments__list {
  margin-block: 0.75rem 1rem;
}
</style>
