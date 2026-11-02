import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CommentActions from '../CommentActions.vue'
import { i18n, setLocale } from '@/i18n'
import { deleteDiscussionComment, updateDiscussionComment } from '@/services/discussions'

vi.mock('@/services/discussions', () => ({
  deleteDiscussionComment: vi.fn(),
  updateDiscussionComment: vi.fn(),
}))

describe('CommentActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setLocale('en')
  })

  function mountActions() {
    return mount(CommentActions, {
      props: {
        commentId: 'comment-id',
        body: 'Original comment',
        deleted: false,
        canEdit: true,
        canDelete: true,
      },
      global: {
        plugins: [i18n],
      },
      slots: {
        default: '<p>Original comment</p>',
      },
    })
  }

  it('updates the comment and asks the parent to reload it', async () => {
    const wrapper = mountActions()
    expect(wrapper.text()).toContain('Original comment')
    await wrapper.get('button[aria-label="Edit"]').trigger('click')
    expect(wrapper.text()).not.toContain('Original comment')
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Original comment')
    await wrapper.get('textarea').setValue('Edited comment')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(vi.mocked(updateDiscussionComment)).toHaveBeenCalledWith(
      'comment-id',
      'Edited comment',
    )
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })

  it('confirms and soft-deletes the comment', async () => {
    const wrapper = mountActions()
    await wrapper.get('button[aria-label="Delete"]').trigger('click')
    await wrapper.get('button.comment-actions__save').trigger('click')
    await flushPromises()

    expect(vi.mocked(deleteDiscussionComment)).toHaveBeenCalledWith('comment-id')
    expect(wrapper.emitted('updated')).toHaveLength(1)
  })
})
