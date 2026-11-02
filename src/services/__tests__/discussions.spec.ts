import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDiscussion, formatDiscussionDateTime } from '../discussions'

const { fromMock, insertMock, selectMock, singleMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  selectMock: vi.fn(),
  singleMock: vi.fn(),
}))
vi.mock('@/config/supabase', () => ({
  supabase: { from: fromMock },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('discussion formatting', () => {
  it('formats timestamps using the selected locale', () => {
    const timestamp = '2026-03-04T15:07:00.000Z'

    expect(formatDiscussionDateTime(timestamp, 'en')).toContain('2026')
    expect(formatDiscussionDateTime(timestamp, 'de')).toContain('2026')
    expect(formatDiscussionDateTime(timestamp, 'en')).not.toBe(
      formatDiscussionDateTime(timestamp, 'de'),
    )
  })
})

describe('createDiscussion', () => {
  it('creates a root thread and returns its generated id', async () => {
    singleMock.mockResolvedValue({ data: { id: 'new-thread-id' }, error: null })
    selectMock.mockReturnValue({ single: singleMock })
    insertMock.mockReturnValue({ select: selectMock })
    fromMock.mockReturnValue({ insert: insertMock })

    await expect(createDiscussion('  A new discussion  ')).resolves.toBe('new-thread-id')
    expect(fromMock).toHaveBeenCalledWith('comments')
    expect(insertMock).toHaveBeenCalledWith({ body: 'A new discussion' })
    expect(selectMock).toHaveBeenCalledWith('id')
  })

  it('rejects empty discussion text without inserting', async () => {
    await expect(createDiscussion('  ')).rejects.toThrow('Discussion text cannot be empty')
    expect(fromMock).not.toHaveBeenCalled()
  })
})
