<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isLocalDevelopmentAuthEnabled, useAuthStore } from '@/stores/auth'
import PageTitle from '@/components/PageTitle.vue'
import {
  createDiscussion,
  formatDiscussionDateTime,
  loadDiscussionThreads,
  type DiscussionThread,
} from '@/services/discussions'
import ReactionControl from '@/components/discussions/ReactionControl.vue'
import CommentActions from '@/components/discussions/CommentActions.vue'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const threads = ref<DiscussionThread[]>([])
const draft = ref('')
const isComposerOpen = ref(false)
const isPosting = ref(false)
const hasCreateError = ref(false)
const isLoading = ref(true)
const isLoadingMore = ref(false)
const hasError = ref(false)
const hasMoreError = ref(false)
const hasMore = ref(false)
const pageSize = 50

async function load(reset = true): Promise<void> {
  if (reset) {
    isLoading.value = true
    hasError.value = false
    hasMore.value = false
    threads.value = []
  } else {
    isLoadingMore.value = true
    hasMoreError.value = false
  }

  try {
    const nextPage = await loadDiscussionThreads(reset ? 0 : threads.value.length, pageSize)
    threads.value = reset ? nextPage : [...threads.value, ...nextPage]
    hasMore.value = nextPage.length === pageSize
  } catch {
    if (reset) {
      hasError.value = true
    } else {
      hasMoreError.value = true
    }
  } finally {
    if (reset) {
      isLoading.value = false
    } else {
      isLoadingMore.value = false
    }
  }
}

function loadMore(): void {
  void load(false)
}

function retryLoad(): void {
  void load()
}

function startDiscussion(): void {
  if (!auth.user) {
    void auth.signInWithGoogle()
    return
  }
  isComposerOpen.value = true
  hasCreateError.value = false
}

function cancelDiscussion(): void {
  isComposerOpen.value = false
  draft.value = ''
  hasCreateError.value = false
}

async function submitDiscussion(): Promise<void> {
  const body = draft.value.trim()
  if (!auth.user || !body || isPosting.value) {
    return
  }

  isPosting.value = true
  hasCreateError.value = false

  try {
    const threadId = await createDiscussion(body)
    await router.push({ name: 'discussion-thread', params: { threadId } })
  } catch {
    hasCreateError.value = true
  } finally {
    isPosting.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <section class="page-content page-content--after-eyebrow discussions-page">
    <header class="discussions-page__header">
      <div class="discussions-page__title-row">
        <PageTitle>{{ t('discussions.title') }}</PageTitle>
        <button
          v-if="auth.user || !isLocalDevelopmentAuthEnabled"
          type="button"
          class="discussions-page__create-button"
          :disabled="auth.isLoading || auth.isSigningIn"
          @click="startDiscussion"
        >
          {{ t(auth.user ? 'discussions.create' : 'discussions.signInToCreate') }}
        </button>
        <p v-else class="discussions-page__local-sign-in">
          {{ t('discussions.localSignInHint') }}
        </p>
      </div>
      <p>{{ t('discussions.description') }}</p>
    </header>

    <form
      v-if="isComposerOpen && auth.user"
      class="discussion-composer"
      @submit.prevent="submitDiscussion"
    >
      <label class="discussion-composer__label">
        {{ t('discussions.discussionPrompt') }}
        <textarea v-model="draft" rows="4" required :disabled="isPosting" />
      </label>
      <p v-if="hasCreateError" class="discussion-composer__error" role="alert">
        {{ t('discussions.createError') }}
      </p>
      <div class="discussion-composer__actions">
        <button
          class="discussions-page__create-button"
          type="submit"
          :disabled="!draft.trim() || isPosting"
        >
          {{ isPosting ? t('discussions.creating') : t('discussions.submitDiscussion') }}
        </button>
        <button
          class="discussion-composer__cancel"
          type="button"
          :disabled="isPosting"
          @click="cancelDiscussion"
        >
          {{ t('discussions.cancel') }}
        </button>
      </div>
    </form>

    <p v-if="isLoading" class="discussions-page__status" role="status">
      {{ t('discussions.loading') }}
    </p>
    <div v-else-if="hasError" class="discussions-page__status" role="alert">
      <p>{{ t('discussions.loadError') }}</p>
      <button type="button" class="discussions-page__retry" @click="retryLoad">
        {{ t('discussions.retry') }}
      </button>
    </div>
    <p v-else-if="threads.length === 0" class="discussions-page__status">
      {{ t('discussions.empty') }}
    </p>

    <template v-else>
      <ul class="discussion-list">
        <li v-for="thread in threads" :key="thread.id" class="discussion-list__item">
          <article class="discussion-card">
            <CommentActions
              :comment-id="thread.id"
              :body="thread.body"
              :deleted="Boolean(thread.deleted_at)"
              :can-edit="thread.canEdit"
              :can-delete="thread.canDelete"
              @updated="load"
            >
              <RouterLink class="discussion-card__link" :to="`/discussions/${thread.id}`">
                <p class="discussion-card__body">
                  {{ thread.deleted_at ? t('discussions.deleted') : thread.body }}
                </p>
              </RouterLink>
            </CommentActions>
            <footer class="discussion-card__footer">
              <time :datetime="thread.created_at">
                {{ formatDiscussionDateTime(thread.created_at, locale) }}
              </time>
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
        </li>
      </ul>
      <div v-if="hasMore" class="discussions-page__pagination">
        <p v-if="hasMoreError" role="alert">{{ t('discussions.loadError') }}</p>
        <button
          type="button"
          class="discussions-page__retry"
          :disabled="isLoadingMore"
          @click="loadMore"
        >
          {{ isLoadingMore ? t('discussions.loadingMore') : t('discussions.loadMore') }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.discussions-page {
  padding-block-end: clamp(2rem, 7vw, 4rem);
}

.discussions-page__header {
  margin-block-end: 2rem;
}

.discussions-page__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.discussions-page__header p {
  margin-block: 0.75rem 0;
  color: var(--wa-color-text-quiet);
}

.discussions-page__local-sign-in {
  max-width: 20rem;
  margin: 0;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
}

.discussions-page__create-button,
.discussion-composer__cancel {
  border: 0;
  border-radius: var(--wa-border-radius-m);
  font: inherit;
  font-weight: var(--wa-font-weight-semibold);
  padding: 0.7rem 1rem;
  cursor: pointer;
}

.discussions-page__create-button {
  color: var(--wa-color-brand-on-loud);
  background: var(--wa-color-brand-fill-loud);
  max-width: 100%;
  min-width: 0;
  padding: 0.85rem 1.25rem;
  white-space: normal;
}

.discussions-page__create-button:disabled,
.discussion-composer__cancel:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.discussion-composer {
  display: grid;
  width: min(100%, 52rem);
  gap: 0.75rem;
  margin-block-end: 1.5rem;
  margin-inline: auto;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-l);
  background: color-mix(in srgb, var(--wa-color-surface-raised) 90%, transparent);
  padding: clamp(1rem, 3vw, 1.5rem);
  box-shadow: var(--wa-shadow-s);
  backdrop-filter: blur(3px);
}

.discussion-composer__label {
  display: grid;
  gap: 0.4rem;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
  font-weight: var(--wa-font-weight-semibold);
}

.discussion-composer textarea {
  width: 100%;
  min-height: 7rem;
  resize: vertical;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-m);
  color: var(--wa-color-text-normal);
  background: var(--wa-color-surface-default);
  font: inherit;
  padding: 0.75rem;
}

.discussion-composer textarea:focus-visible {
  outline: var(--wa-focus-ring);
  outline-offset: var(--wa-focus-ring-offset);
}

.discussion-composer__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.discussion-composer__cancel {
  color: var(--wa-color-text-normal);
  background: var(--wa-color-neutral-fill-quiet);
}

.discussion-composer__error {
  margin: 0;
  color: var(--wa-color-danger-on-normal);
}

.discussions-page__status {
  display: grid;
  width: min(100%, 52rem);
  justify-items: start;
  gap: 0.75rem;
  margin-inline: auto;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-l);
  background: color-mix(in srgb, var(--wa-color-surface-raised) 90%, transparent);
  color: var(--wa-color-text-quiet);
  padding: 1.5rem;
  box-shadow: var(--wa-shadow-s);
  backdrop-filter: blur(3px);
}

.discussions-page__retry {
  border: 0;
  color: var(--wa-color-brand-on-normal);
  background: transparent;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.discussions-page__pagination {
  display: grid;
  width: min(100%, 52rem);
  justify-items: center;
  gap: 0.5rem;
  margin-block-start: 1.5rem;
  margin-inline: auto;
}

.discussions-page__pagination p {
  color: var(--wa-color-danger-on-normal);
}

.discussion-list {
  display: grid;
  gap: 1rem;
  width: min(100%, 52rem);
  margin: 0;
  margin-inline: auto;
  padding: 0;
  list-style: none;
}

.discussion-card {
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-l);
  background: color-mix(in srgb, var(--wa-color-surface-raised) 90%, transparent);
  padding: clamp(1rem, 3vw, 1.5rem);
  box-shadow: var(--wa-shadow-s);
  backdrop-filter: blur(3px);
}

.discussion-card__link {
  display: block;
  color: var(--wa-color-text-normal);
  text-decoration: none;
}

.discussion-card__link:hover .discussion-card__body {
  color: var(--wa-color-brand-on-normal);
}

.discussion-card__body {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.discussion-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-block-start: 0.75rem;
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
}
</style>
