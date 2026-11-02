<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { deleteDiscussionComment, updateDiscussionComment } from '@/services/discussions'

const props = defineProps<{
  commentId: string
  body: string
  deleted: boolean
  canEdit: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  updated: []
}>()

const { t } = useI18n()
const draft = ref(props.body)
const isEditing = ref(false)
const isConfirmingDelete = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const operationError = ref<'edit' | 'delete' | null>(null)
const hasManagementActions = computed(() => !props.deleted && (props.canEdit || props.canDelete))
const errorMessage = computed(() =>
  operationError.value === 'edit'
    ? t('discussions.editError')
    : operationError.value === 'delete'
      ? t('discussions.deleteError')
      : '',
)

function startEditing(): void {
  draft.value = props.body
  operationError.value = null
  isEditing.value = true
}

function cancelEditing(): void {
  isEditing.value = false
  draft.value = props.body
}

async function saveEdit(): Promise<void> {
  const content = draft.value.trim()
  if (!content || isSaving.value) {
    return
  }

  isSaving.value = true
  operationError.value = null
  try {
    await updateDiscussionComment(props.commentId, content)
    isEditing.value = false
    emit('updated')
  } catch {
    operationError.value = 'edit'
  } finally {
    isSaving.value = false
  }
}

async function deleteComment(): Promise<void> {
  if (isDeleting.value) {
    return
  }

  isDeleting.value = true
  operationError.value = null
  try {
    await deleteDiscussionComment(props.commentId)
    isConfirmingDelete.value = false
    emit('updated')
  } catch {
    operationError.value = 'delete'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="comment-actions">
    <div
      v-if="hasManagementActions && !isEditing && !isConfirmingDelete"
      class="comment-actions__toolbar"
    >
      <button
        v-if="canEdit"
        type="button"
        class="comment-actions__icon-button"
        :aria-label="t('discussions.edit')"
        :title="t('discussions.edit')"
        @click="startEditing"
      >
        <wa-icon name="pen" aria-hidden="true" />
      </button>
      <button
        v-if="canDelete"
        type="button"
        class="comment-actions__icon-button"
        :aria-label="t('discussions.delete')"
        :title="t('discussions.delete')"
        @click="isConfirmingDelete = true"
      >
        <wa-icon name="trash" aria-hidden="true" />
      </button>
    </div>

    <div v-if="!isEditing" class="comment-actions__body">
      <slot />
    </div>

    <form v-else class="comment-actions__edit" @submit.prevent="saveEdit">
      <label class="comment-actions__edit-label">
        <span class="comment-actions__visually-hidden">{{ t('discussions.editComment') }}</span>
        <textarea v-model="draft" rows="3" required :disabled="isSaving" />
      </label>
      <div class="comment-actions__buttons">
        <button
          class="comment-actions__save"
          type="submit"
          :disabled="!draft.trim() || isSaving"
        >
          {{ isSaving ? t('discussions.savingComment') : t('discussions.saveChanges') }}
        </button>
        <button
          class="comment-actions__cancel"
          type="button"
          :disabled="isSaving"
          @click="cancelEditing"
        >
          {{ t('discussions.cancel') }}
        </button>
      </div>
    </form>

    <div v-if="isConfirmingDelete" class="comment-actions__confirmation" role="group">
      <p>{{ t('discussions.confirmDeleteComment') }}</p>
      <div class="comment-actions__buttons">
        <button
          class="comment-actions__save"
          type="button"
          :disabled="isDeleting"
          @click="deleteComment"
        >
          {{ isDeleting ? t('discussions.deletingComment') : t('discussions.confirmDelete') }}
        </button>
        <button
          class="comment-actions__cancel"
          type="button"
          :disabled="isDeleting"
          @click="isConfirmingDelete = false"
        >
          {{ t('discussions.cancel') }}
        </button>
      </div>
    </div>

    <p v-if="operationError" class="comment-actions__error" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.comment-actions {
  display: grid;
  min-width: 0;
  gap: 0.25rem;
}

.comment-actions__toolbar {
  display: flex;
  min-height: 2rem;
  justify-content: flex-end;
  gap: 0.25rem;
}

.comment-actions__icon-button {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--wa-color-text-quiet);
  background: transparent;
  cursor: pointer;
}

.comment-actions__icon-button:hover {
  color: var(--wa-color-brand-on-normal);
  background: var(--wa-color-brand-fill-quiet);
}

.comment-actions__icon-button wa-icon {
  font-size: 0.95rem;
}

.comment-actions__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.comment-actions button {
  font: inherit;
  font-size: var(--wa-font-size-s);
  cursor: pointer;
}

.comment-actions__save,
.comment-actions__cancel {
  border: 0;
  border-radius: var(--wa-border-radius-m);
  padding: 0.45rem 0.75rem;
}

.comment-actions__save {
  color: var(--wa-color-brand-on-loud);
  background: var(--wa-color-brand-fill-loud);
}

.comment-actions__cancel {
  color: var(--wa-color-text-quiet);
  background: transparent;
}

.comment-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.comment-actions button:focus-visible,
.comment-actions textarea:focus-visible {
  outline: var(--wa-focus-ring);
  outline-offset: var(--wa-focus-ring-offset);
}

.comment-actions__edit {
  display: grid;
  width: 100%;
  gap: 0.75rem;
}

.comment-actions__edit-label {
  display: block;
}

.comment-actions__visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.comment-actions textarea {
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

.comment-actions__confirmation p,
.comment-actions__error {
  margin: 0;
}

.comment-actions__confirmation {
  display: grid;
  justify-items: start;
  gap: 0.6rem;
}

.comment-actions__error {
  color: var(--wa-color-danger-on-normal);
}
</style>
