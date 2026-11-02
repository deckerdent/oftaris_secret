import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n, setLocale } from '@/i18n'
import ReactionControl from '../ReactionControl.vue'
import { updateDiscussionReaction } from '@/services/discussions'

vi.mock('@/services/discussions', () => ({
  updateDiscussionReaction: vi.fn(),
}))

describe('ReactionControl', () => {
  beforeEach(() => {
    setLocale('en')
    vi.clearAllMocks()
    vi.mocked(updateDiscussionReaction).mockResolvedValue()
  })

  it('adds likes and subtracts dislikes from the net score', async () => {
    const wrapper = mount(ReactionControl, {
      props: {
        target: 'thread',
        targetId: 'thread-id',
        score: 2,
        myReaction: null,
        canReact: true,
      },
      global: { plugins: [i18n] },
    })
    const upButton = wrapper.get('button[aria-label="Like"]')
    const downButton = wrapper.get('button[aria-label="Dislike"]')

    await downButton.trigger('click')
    expect(wrapper.get('.reaction-control__score').text()).toBe('1')
    expect(downButton.attributes('aria-pressed')).toBe('true')

    await upButton.trigger('click')
    expect(wrapper.get('.reaction-control__score').text()).toBe('3')
    expect(upButton.attributes('aria-pressed')).toBe('true')
    expect(downButton.attributes('aria-pressed')).toBe('false')

    await upButton.trigger('click')
    expect(wrapper.get('.reaction-control__score').text()).toBe('2')
    expect(upButton.attributes('aria-pressed')).toBe('false')
    expect(updateDiscussionReaction).toHaveBeenNthCalledWith(1, 'thread', 'thread-id', 'dislike')
    expect(updateDiscussionReaction).toHaveBeenNthCalledWith(2, 'thread', 'thread-id', 'like')
    expect(updateDiscussionReaction).toHaveBeenNthCalledWith(3, 'thread', 'thread-id', null)
  })

  it('keeps voting disabled for signed-out visitors', () => {
    const wrapper = mount(ReactionControl, {
      props: {
        target: 'comment',
        targetId: 'comment-id',
        score: 0,
        myReaction: null,
        canReact: false,
      },
      global: { plugins: [i18n] },
    })

    expect(wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined))
      .toBe(true)
  })
})
