-- Migration: Create workspace_invites table for email invitation funnel
-- This table stores token-based invitations sent via email

CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  token         TEXT NOT NULL UNIQUE,
  invited_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at    TIMESTAMPTZ NOT NULL,
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);

-- Index for listing invites per workspace
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);

-- Auto-expire: mark invites as expired when past their expiry date
-- (handled in application logic, but index helps)
CREATE INDEX IF NOT EXISTS idx_workspace_invites_expires ON public.workspace_invites(expires_at);

-- RLS: enable row-level security
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- Owners and managers can view all invites for their workspace
CREATE POLICY "workspace_invites_select" ON public.workspace_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = workspace_invites.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'manager')
        AND wm.status = 'active'
    )
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Only service role can insert/update (handled via admin client in API)
CREATE POLICY "workspace_invites_service_only_insert" ON public.workspace_invites
  FOR INSERT WITH CHECK (false);

CREATE POLICY "workspace_invites_service_only_update" ON public.workspace_invites
  FOR UPDATE USING (false);
