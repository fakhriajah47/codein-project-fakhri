import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  // Test if table already exists
  const { error: checkError } = await supabase.from('workspace_invites').select('id').limit(1);
  
  if (!checkError) {
    console.log('Table workspace_invites already exists!');
    return;
  }
  
  console.log('Table does not exist, needs to be created via Supabase Dashboard SQL Editor.');
  console.log('Error:', checkError.message);
  console.log('\nRun this SQL in your Supabase Dashboard > SQL Editor:\n');
  console.log(`
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','manager','member','viewer')),
  token         TEXT NOT NULL UNIQUE,
  invited_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  expires_at    TIMESTAMPTZ NOT NULL,
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace ON public.workspace_invites(workspace_id);
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
  `);
}

run().catch(console.error);
