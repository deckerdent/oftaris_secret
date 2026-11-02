<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import type { CommentNode as DiscussionCommentNode } from '@/services/discussions'
import { formatDiscussionDateTime } from '@/services/discussions'
import CommentActions from './CommentActions.vue'
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
const isReplying = ref(false)
const displayBody = computed(() =>
  props.comment.deleted_at ? t('discussions.deleted') : props.comment.body,
)
const createdAt = computed(() =>
  formatDiscussionDateTime(props.comment.created_at, locale.value),
)

function handleReplyPosted(): void {
  isReplying.value = false
  emit('posted')
}
</script>

<template>
  <article class="comment-node" :class="{ 'comment-node--child': (depth ?? 0) > 0 }">
    <CommentActions
      :comment-id="comment.id"
      :body="comment.body"
      :deleted="Boolean(comment.deleted_at)"
      :can-edit="comment.canEdit"
      :can-delete="comment.canDelete"
      @updated="emit('posted')"
    >
      <p class="comment-node__body">{{ displayBody }}</p>
    </CommentActions>
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
    <button
      v-if="auth.user && !comment.deleted_at"
      type="button"
      class="comment-node__reply-toggle"
      :aria-expanded="isReplying"
      @click="isReplying = !isReplying"
    >
      {{ t('discussions.reply') }}
    </button>
    <div v-if="isReplying" class="comment-node__reply">
      <ReplyComposer :parent-comment-id="comment.id" @posted="handleReplyPosted" />
    </div>
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

.comment-node__reply-toggle {
  justify-self: start;
  border: 0;
  color: var(--wa-color-text-quiet);
  background: transparent;
  font: inherit;
  font-size: 0.8rem;
  padding: 0.15rem 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.comment-node__reply-toggle:hover {
  color: var(--wa-color-brand-on-normal);
}

.comment-node__reply-toggle:focus-visible {
  outline: var(--wa-focus-ring);
  outline-offset: var(--wa-focus-ring-offset);
}

.comment-node__reply {
  display: grid;
  gap: 0.75rem;
}

.comment-node__children {
  border-block-start: 1px solid var(--wa-color-surface-border);
}
</style>
