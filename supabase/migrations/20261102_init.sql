CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE private.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE private.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role = 'admin'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_comment_id uuid REFERENCES public.comments (id) ON DELETE RESTRICT,
  thread_id uuid NOT NULL REFERENCES public.comments (id) ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  body text NOT NULL CHECK (char_length(btrim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT comments_root_thread_id_check CHECK (
    (parent_comment_id IS NULL AND thread_id = id)
    OR (parent_comment_id IS NOT NULL AND thread_id <> id)
  )
);

CREATE TABLE private.comment_owners (
  comment_id uuid PRIMARY KEY REFERENCES public.comments (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE
);

CREATE TABLE private.comment_reactions (
  comment_id uuid NOT NULL REFERENCES public.comments (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE private.thread_reactions (
  thread_id uuid NOT NULL REFERENCES public.comments (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE INDEX comments_thread_created_idx ON public.comments (thread_id, created_at, id);
CREATE INDEX comments_parent_created_idx ON public.comments (parent_comment_id, created_at, id);
CREATE INDEX comment_owners_user_id_idx ON private.comment_owners (user_id);
CREATE INDEX comment_reactions_user_id_idx ON private.comment_reactions (user_id);
CREATE INDEX thread_reactions_user_id_idx ON private.thread_reactions (user_id);

ALTER TABLE private.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.comment_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.thread_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION private.sync_user_profile_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO private.user_profiles (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(pg_catalog.btrim(pg_catalog.left(NEW.raw_user_meta_data ->> 'full_name', 200)), ''),
      NULLIF(pg_catalog.btrim(pg_catalog.left(NEW.raw_user_meta_data ->> 'name', 200)), '')
    ),
    COALESCE(
      NULLIF(pg_catalog.left(NEW.raw_user_meta_data ->> 'avatar_url', 2048), ''),
      NULLIF(pg_catalog.left(NEW.raw_user_meta_data ->> 'picture', 2048), '')
    )
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = pg_catalog.now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_user_profile_from_auth() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER sync_user_profile_from_auth
AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.sync_user_profile_from_auth();

INSERT INTO private.user_profiles (user_id, email, display_name, avatar_url)
SELECT
  users.id,
  users.email,
  COALESCE(
    NULLIF(pg_catalog.btrim(pg_catalog.left(users.raw_user_meta_data ->> 'full_name', 200)), ''),
    NULLIF(pg_catalog.btrim(pg_catalog.left(users.raw_user_meta_data ->> 'name', 200)), '')
  ),
  COALESCE(
    NULLIF(pg_catalog.left(users.raw_user_meta_data ->> 'avatar_url', 2048), ''),
    NULLIF(pg_catalog.left(users.raw_user_meta_data ->> 'picture', 2048), '')
  )
FROM auth.users AS users
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = pg_catalog.now();

CREATE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.user_roles AS roles
    WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
  );
$$;

CREATE FUNCTION private.is_comment_owner(p_comment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.comment_owners AS owners
    WHERE owners.comment_id = p_comment_id
      AND owners.user_id = auth.uid()
  );
$$;

CREATE FUNCTION private.can_edit_comment(p_comment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.comments AS comment
    JOIN private.comment_owners AS owners ON owners.comment_id = comment.id
    WHERE comment.id = p_comment_id
      AND comment.deleted_at IS NULL
      AND owners.user_id = auth.uid()
  );
$$;

CREATE FUNCTION private.assign_comment_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  parent_thread_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to create comments'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.id IS NULL THEN
    NEW.id := pg_catalog.gen_random_uuid();
  END IF;

  IF NEW.parent_comment_id IS NULL THEN
    NEW.thread_id := NEW.id;
  ELSE
    SELECT parent.thread_id
    INTO parent_thread_id
    FROM public.comments AS parent
    JOIN public.comments AS root ON root.id = parent.thread_id
    WHERE parent.id = NEW.parent_comment_id
      AND parent.deleted_at IS NULL
      AND root.deleted_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent comment does not exist or its thread is deleted'
        USING ERRCODE = '23503';
    END IF;

    NEW.thread_id := parent_thread_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION private.record_comment_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO private.comment_owners (comment_id, user_id)
  VALUES (NEW.id, auth.uid());
  RETURN NEW;
END;
$$;

CREATE FUNCTION private.set_comment_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_comment_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_edit_comment(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.assign_comment_thread() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.record_comment_owner() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.set_comment_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER assign_comment_thread
BEFORE INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION private.assign_comment_thread();

CREATE TRIGGER record_comment_owner
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION private.record_comment_owner();

CREATE TRIGGER set_comment_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION private.set_comment_updated_at();

CREATE POLICY comments_read
ON public.comments
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY comments_create
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY comments_update_own
ON public.comments
FOR UPDATE
TO authenticated
USING (private.can_edit_comment(id))
WITH CHECK (private.can_edit_comment(id));

REVOKE ALL ON TABLE public.comments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.comments TO anon, authenticated;
GRANT INSERT (parent_comment_id, body) ON TABLE public.comments TO authenticated;
GRANT UPDATE (body) ON TABLE public.comments TO authenticated;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_comment_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_edit_comment(uuid) TO authenticated;

CREATE FUNCTION public.delete_comment(p_comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to delete comments'
      USING ERRCODE = '42501';
  END IF;

  IF NOT private.is_admin() AND NOT private.is_comment_owner(p_comment_id) THEN
    RAISE EXCEPTION 'Not authorized to delete this comment'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.comments
  SET body = '[deleted]',
      deleted_at = COALESCE(deleted_at, pg_catalog.now())
  WHERE id = p_comment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE FUNCTION public.set_comment_reaction(p_comment_id uuid, p_reaction text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_id uuid := auth.uid();
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to react'
      USING ERRCODE = '42501';
  END IF;

  IF p_reaction IS NOT NULL AND p_reaction NOT IN ('like', 'dislike') THEN
    RAISE EXCEPTION 'Reaction must be like, dislike, or null'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.comments AS comment
    WHERE comment.id = p_comment_id
      AND comment.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Comment does not exist or has been deleted'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_reaction IS NULL THEN
    DELETE FROM private.comment_reactions
    WHERE comment_id = p_comment_id
      AND user_id = actor_id;
  ELSE
    INSERT INTO private.comment_reactions (comment_id, user_id, reaction_type)
    VALUES (p_comment_id, actor_id, p_reaction)
    ON CONFLICT (comment_id, user_id) DO UPDATE
    SET reaction_type = EXCLUDED.reaction_type,
        updated_at = pg_catalog.now();
  END IF;
END;
$$;

CREATE FUNCTION public.set_thread_reaction(p_thread_id uuid, p_reaction text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_id uuid := auth.uid();
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to react'
      USING ERRCODE = '42501';
  END IF;

  IF p_reaction IS NOT NULL AND p_reaction NOT IN ('like', 'dislike') THEN
    RAISE EXCEPTION 'Reaction must be like, dislike, or null'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.comments AS thread
    WHERE thread.id = p_thread_id
      AND thread.parent_comment_id IS NULL
      AND thread.thread_id = thread.id
      AND thread.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Thread does not exist or has been deleted'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_reaction IS NULL THEN
    DELETE FROM private.thread_reactions
    WHERE thread_id = p_thread_id
      AND user_id = actor_id;
  ELSE
    INSERT INTO private.thread_reactions (thread_id, user_id, reaction_type)
    VALUES (p_thread_id, actor_id, p_reaction)
    ON CONFLICT (thread_id, user_id) DO UPDATE
    SET reaction_type = EXCLUDED.reaction_type,
        updated_at = pg_catalog.now();
  END IF;
END;
$$;

CREATE FUNCTION public.get_comment_reaction_summaries(p_comment_ids uuid[])
RETURNS TABLE (comment_id uuid, reaction_count bigint, my_reaction text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    comment.id,
    pg_catalog.count(reaction.user_id),
    pg_catalog.max(reaction.reaction_type) FILTER (WHERE reaction.user_id = auth.uid())
  FROM (
    SELECT DISTINCT requested.id
    FROM pg_catalog.unnest(p_comment_ids) AS requested(id)
  ) AS requested
  JOIN public.comments AS comment ON comment.id = requested.id
  LEFT JOIN private.comment_reactions AS reaction ON reaction.comment_id = comment.id
  GROUP BY comment.id;
$$;

CREATE FUNCTION public.get_thread_reaction_summaries(p_thread_ids uuid[])
RETURNS TABLE (thread_id uuid, reaction_count bigint, my_reaction text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    thread.id,
    pg_catalog.count(reaction.user_id),
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

REVOKE ALL ON FUNCTION public.delete_comment(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_comment_reaction(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_thread_reaction(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_comment_reaction_summaries(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_thread_reaction_summaries(uuid[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.delete_comment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_comment_reaction(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_thread_reaction(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_comment_reaction_summaries(uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_thread_reaction_summaries(uuid[]) TO anon, authenticated;
