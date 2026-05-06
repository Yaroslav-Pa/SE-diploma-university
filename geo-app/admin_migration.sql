-- Add is_admin flag to users (safe to run multiple times)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Allow admins to delete any comment (replaces owner-only policy)
DROP POLICY IF EXISTS "Users can delete their own comments." ON public.comments;
CREATE POLICY "Users can delete their own or admins can delete any comments."
  ON public.comments FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow admins to delete any POI (replaces owner-only policy)
DROP POLICY IF EXISTS "Users can delete their own POIs." ON public.pois;
CREATE POLICY "Users can delete their own or admins can delete any POIs."
  ON public.pois FOR DELETE USING (
    auth.uid() = creator_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );
