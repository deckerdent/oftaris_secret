import { supabase } from '@/config/supabase'

export type Reaction = 'like' | 'dislike' | null
export type ReactionTarget = 'comment' | 'thread'

export interface DiscussionComment {
  id: string
  parent_comment_id: string | null
  thread_id: string
  body: string
  created_at: string
  deleted_at: string | null
}

export interface DiscussionThread extends DiscussionComment {
  reactionScore: number
  myReaction: Reaction
  canEdit: boolean
  canDelete: boolean
}

export interface CommentNode extends DiscussionThread {
  children: CommentNode[]
}

interface ReactionSummary {
  comment_id?: string
  thread_id?: string
  reaction_score: number
  my_reaction: Reaction
}

interface CommentManagementPermission {
  comment_id: string
  can_edit: boolean
  can_delete: boolean
}

const commentSelection = 'id, parent_comment_id, thread_id, body, created_at, deleted_at'

async function loadCommentManagementPermissions(
  ids: string[],
): Promise<Map<string, { canEdit: boolean; canDelete: boolean }>> {
  if (ids.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase.rpc('get_comment_management_permissions', {
    p_comment_ids: ids,
  })

  if (error) {
    throw new Error(error.message)
  }

  const permissions = new Map<string, { canEdit: boolean; canDelete: boolean }>()
  for (const permission of (data ?? []) as CommentManagementPermission[]) {
    permissions.set(permission.comment_id, {
      canEdit: permission.can_edit,
      canDelete: permission.can_delete,
    })
  }
  return permissions
}

function getCommentManagementPermission(
  permissions: Map<string, { canEdit: boolean; canDelete: boolean }>,
  id: string,
): { canEdit: boolean; canDelete: boolean } {
  const permission = permissions.get(id)
  if (!permission) {
    throw new Error(`Comment permissions were not returned for ${id}`)
  }
  return permission
}

async function loadReactionSummaries(
  target: ReactionTarget,
  ids: string[],
): Promise<Map<string, ReactionSummary>> {
  if (ids.length === 0) {
    return new Map()
  }

  const { data, error } =
    target === 'thread'
      ? await supabase.rpc('get_thread_reaction_summaries', { p_thread_ids: ids })
      : await supabase.rpc('get_comment_reaction_summaries', { p_comment_ids: ids })

  if (error) {
    throw new Error(error.message)
  }

  const summaries = new Map<string, ReactionSummary>()
  for (const summary of data ?? []) {
    const id = target === 'thread' ? summary.thread_id : summary.comment_id
    if (id) {
      summaries.set(id, summary)
    }
  }
  return summaries
}

export async function loadDiscussionThreads(
  offset = 0,
  pageSize = 50,
): Promise<DiscussionThread[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(commentSelection)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    throw new Error(error.message)
  }

  const rows = data ?? []
  const ids = rows.map((row) => row.id)
  const [summaries, permissions] = await Promise.all([
    loadReactionSummaries('thread', ids),
    loadCommentManagementPermissions(ids),
  ])

  return rows.map((row) => {
    const permission = getCommentManagementPermission(permissions, row.id)
    return {
      ...row,
      ...permission,
      reactionScore: summaries.get(row.id)?.reaction_score ?? 0,
      myReaction: summaries.get(row.id)?.my_reaction ?? null,
    }
  })
}

export async function loadDiscussionThread(threadId: string): Promise<CommentNode> {
  const { data, error } = await supabase
    .from('comments')
    .select(commentSelection)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const rows = data ?? []
  const thread = rows.find((row) => row.id === threadId && row.parent_comment_id === null)
  if (!thread) {
    throw new Error('Discussion thread not found')
  }

  const [commentSummaries, threadSummaries, permissions] = await Promise.all([
    loadReactionSummaries(
      'comment',
      rows.filter((row) => row.id !== threadId).map((row) => row.id),
    ),
    loadReactionSummaries('thread', [threadId]),
    loadCommentManagementPermissions(rows.map((row) => row.id)),
  ])
  const nodes = new Map<string, CommentNode>(
    rows.map((row) => {
      const summary =
        row.id === threadId
          ? threadSummaries.get(row.id)
          : commentSummaries.get(row.id)
      const permission = getCommentManagementPermission(permissions, row.id)
      return [
        row.id,
        {
          ...row,
          ...permission,
          reactionScore: summary?.reaction_score ?? 0,
          myReaction: summary?.my_reaction ?? null,
          children: [],
        },
      ]
    }),
  )

  for (const row of rows) {
    if (row.id === threadId || row.parent_comment_id === null) {
      continue
    }

    const node = nodes.get(row.id)
    const parent = nodes.get(row.parent_comment_id)
    if (node && parent) {
      parent.children.push(node)
    }
  }

  const root = nodes.get(threadId)
  if (!root) {
    throw new Error('Discussion thread not found')
  }

  return root
}

export async function postDiscussionComment(
  parentCommentId: string,
  body: string,
): Promise<void> {
  const content = body.trim()
  if (!content) {
    throw new Error('Comment text cannot be empty')
  }

  const { error } = await supabase.from('comments').insert({
    parent_comment_id: parentCommentId,
    body: content,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function createDiscussion(body: string): Promise<string> {
  const content = body.trim()
  if (!content) {
    throw new Error('Discussion text cannot be empty')
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({ body: content })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('The discussion was not created')
  }

  return data.id
}

export async function updateDiscussionComment(commentId: string, body: string): Promise<void> {
  const content = body.trim()
  if (!content) {
    throw new Error('Comment text cannot be empty')
  }

  const { data, error } = await supabase
    .from('comments')
    .update({ body: content })
    .eq('id', commentId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('The comment could not be updated')
  }
}

export async function deleteDiscussionComment(commentId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_comment', {
    p_comment_id: commentId,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateDiscussionReaction(
  target: ReactionTarget,
  targetId: string,
  reaction: Reaction,
): Promise<void> {
  const { error } =
    target === 'thread'
      ? await supabase.rpc('set_thread_reaction', {
          p_thread_id: targetId,
          p_reaction: reaction,
        })
      : await supabase.rpc('set_comment_reaction', {
          p_comment_id: targetId,
          p_reaction: reaction,
        })

  if (error) {
    throw new Error(error.message)
  }
}

export function formatDiscussionDateTime(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
