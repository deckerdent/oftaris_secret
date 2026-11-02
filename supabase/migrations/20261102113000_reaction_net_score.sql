DROP FUNCTION IF EXISTS public.get_comment_reaction_summaries(uuid[]);
CREATE FUNCTION public.get_comment_reaction_summaries(p_comment_ids uuid[])
RETURNS TABLE (comment_id uuid, reaction_score bigint, my_reaction text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    comment.id,
    COALESCE(
      pg_catalog.sum(
        CASE reaction.reaction_type
          WHEN 'like' THEN 1
          WHEN 'dislike' THEN -1
          ELSE 0
        END
      ),
      0
    ),
    pg_catalog.max(reaction.reaction_type) FILTER (WHERE reaction.user_id = auth.uid())
  FROM (
    SELECT DISTINCT requested.id
    FROM pg_catalog.unnest(p_comment_ids) AS requested(id)
  ) AS requested
  JOIN public.comments AS comment ON comment.id = requested.id
  LEFT JOIN private.comment_reactions AS reaction ON reaction.comment_id = comment.id
  GROUP BY comment.id;
$$;

DROP FUNCTION IF EXISTS public.get_thread_reaction_summaries(uuid[]);
CREATE FUNCTION public.get_thread_reaction_summaries(p_thread_ids uuid[])
RETURNS TABLE (thread_id uuid, reaction_score bigint, my_reaction text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    thread.id,
    COALESCE(
      pg_catalog.sum(
        CASE reaction.reaction_type
          WHEN 'like' THEN 1
          WHEN 'dislike' THEN -1
          ELSE 0
        END
      ),
      0
    ),
    pg_catalog.max(reaction.reaction_type) FILTER (WHERE reaction.user_id = auth.uid())
  FROM (
    SELECT DISTINCT requested.id
    FROM pg_catalog.unnest(p_thread_ids) AS requested(id)
  ) AS requested
  JOIN public.comments AS thread
    ON thread.id = requested.id
   AND thread.parent_comment_id IS NULL
   AND thread.thread_id = thread.id
  LEFT JOIN private.thread_reactions AS reaction ON reaction.thread_id = thread.id
  GROUP BY thread.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_comment_reaction_summaries(uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_thread_reaction_summaries(uuid[]) TO anon, authenticated;
