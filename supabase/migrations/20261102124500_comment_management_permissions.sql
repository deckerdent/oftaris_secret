CREATE FUNCTION public.get_comment_management_permissions(p_comment_ids uuid[])
RETURNS TABLE(comment_id uuid, can_edit boolean, can_delete boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    comment.id,
    private.can_edit_comment(comment.id),
    private.is_admin() OR private.is_comment_owner(comment.id)
  FROM public.comments AS comment
  WHERE comment.id = ANY(p_comment_ids);
$$;

REVOKE ALL ON FUNCTION public.get_comment_management_permissions(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_comment_management_permissions(uuid[]) TO anon, authenticated;
