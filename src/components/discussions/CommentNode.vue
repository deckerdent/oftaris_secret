<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import type { CommentNode as DiscussionCommentNode } from '@/services/discussions'
import { formatDiscussionDateTime } from '@/services/discussions'
import ReactionControl from './ReactionControl.vue'
import ReplyComposer from './ReplyComposer.vue'

defineOptions({ name: 'CommentNode' })

const props = defineProps<{
  comment: DiscussionCommentNode
  depth?: number
}>()

const emit = defineEmits<{
  posted: []
}>()

const { t, locale } = useI18n()
const auth = useAuthStore()
const displayBody = computed(() =>
  props.comment.deleted_at ? t('discussions.deleted') : props.comment.body,
)
const createdAt = computed(() =>
  formatDiscussionDateTime(props.comment.created_at, locale.value),
)
</script>

<template>
  <article class="comment-node" :class="{ 'comment-node--child': (depth ?? 0) > 0 }">
    <p class="comment-node__body">{{ displayBody }}</p>
    <footer class="comment-node__footer">
      <time :datetime="comment.created_at">{{ createdAt }}</time>
      <ReactionControl
        target="comment"
        :target-id="comment.id"
        :score="comment.reactionScore"
        :my-reaction="comment.myReaction"
        :can-react="Boolean(auth.user)"
        :disabled="Boolean(comment.deleted_at)"
      />
    </footer>
    <details v-if="auth.user && !comment.deleted_at" class="comment-node__reply">
      <summary>{{ t('discussions.reply') }}</summary>
      <ReplyComposer :parent-comment-id="comment.id" @posted="emit('posted')" />
    </details>
    <div v-if="comment.children.length" class="comment-node__children">
      <CommentNode
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :depth="(depth ?? 0) + 1"
        @posted="emit('posted')"
      />
    </div>
  </article>
</template>

<style scoped>
.comment-node {
  display: grid;
  gap: 0.6rem;
  padding-block: 1rem;
}

.comment-node--child {
  margin-inline-start: clamp(0.75rem, 3vw, 1.5rem);
  border-inline-start: 2px solid var(--wa-color-surface-border);
  padding-inline-start: clamp(0.75rem, 3vw, 1.25rem);
}

.comment-node__body {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment-node__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
}

.comment-node__reply summary {
  width: fit-content;
  color: var(--wa-color-brand-on-normal);
  cursor: pointer;
  font-size: var(--wa-font-size-s);
}

.comment-node__reply[open] {
  display: grid;
  gap: 0.75rem;
}

.comment-node__children {
  border-block-start: 1px solid var(--wa-color-surface-border);
}
</style>
