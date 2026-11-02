<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  updateDiscussionReaction,
  type Reaction,
  type ReactionTarget,
} from '@/services/discussions'

const props = defineProps<{
  target: ReactionTarget
  targetId: string
  score: number
  myReaction: Reaction
  canReact: boolean
  disabled?: boolean
}>()

const { t } = useI18n()
const score = ref(props.score)
const myReaction = ref(props.myReaction)
const isUpdating = ref(false)
const hasError = ref(false)

watch(
  () => [props.score, props.myReaction] as const,
  ([nextScore, nextReaction]) => {
    score.value = nextScore
    myReaction.value = nextReaction
  },
)

async function setReaction(reaction: Exclude<Reaction, null>): Promise<void> {
  if (!props.canReact || props.disabled || isUpdating.value) {
    return
  }

  const nextReaction = myReaction.value === reaction ? null : reaction
  const scoreFor = (value: Reaction) => (value === 'like' ? 1 : value === 'dislike' ? -1 : 0)
  const scoreChange = scoreFor(nextReaction) - scoreFor(myReaction.value)
  isUpdating.value = true
  hasError.value = false

  try {
    await updateDiscussionReaction(props.target, props.targetId, nextReaction)
    score.value += scoreChange
    myReaction.value = nextReaction
  } catch {
    hasError.value = true
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div class="reaction-control" :aria-busy="isUpdating">
    <button
      type="button"
      class="reaction-control__button"
      :class="{ 'reaction-control__button--active': myReaction === 'like' }"
      :aria-label="t('discussions.voteUp')"
      :aria-pressed="myReaction === 'like'"
      :title="canReact ? t('discussions.voteUp') : t('discussions.signInToVote')"
      :disabled="!canReact || disabled || isUpdating"
      @click="setReaction('like')"
    >
      <wa-icon name="arrow-up" library="system" aria-hidden="true" />
    </button>
    <span class="reaction-control__score" aria-live="polite">{{ score }}</span>
    <button
      type="button"
      class="reaction-control__button"
      :class="{ 'reaction-control__button--active': myReaction === 'dislike' }"
      :aria-label="t('discussions.voteDown')"
      :aria-pressed="myReaction === 'dislike'"
      :title="canReact ? t('discussions.voteDown') : t('discussions.signInToVote')"
      :disabled="!canReact || disabled || isUpdating"
      @click="setReaction('dislike')"
    >
      <wa-icon name="arrow-down" library="system" aria-hidden="true" />
    </button>
    <span v-if="hasError" class="reaction-control__error" role="status">
      {{ t('discussions.reactionError') }}
    </span>
  </div>
</template>

<style scoped>
.reaction-control {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.3rem;
}

.reaction-control__button {
  display: inline-grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 0;
  border-radius: var(--wa-border-radius-m);
  color: var(--wa-color-text-quiet);
  background: transparent;
  cursor: pointer;
}

.reaction-control__button:hover:not(:disabled),
.reaction-control__button--active {
  color: var(--wa-color-brand-on-normal);
  background: var(--wa-color-neutral-fill-quiet);
}

.reaction-control__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.reaction-control__button wa-icon {
  width: 1rem;
  height: 1rem;
}

.reaction-control__score {
  min-width: 1.25rem;
  color: var(--wa-color-text-normal);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.reaction-control__error {
  color: var(--wa-color-danger-on-normal);
  font-size: var(--wa-font-size-s);
}
</style>
