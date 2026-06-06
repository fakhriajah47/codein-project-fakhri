-- Enable RLS
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_attachments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.ai_generations enable row level security;
alter table public.reports enable row level security;
alter table public.integration_settings enable row level security;
alter table public.notification_logs enable row level security;

-- profiles Policies
create policy "users can read own or team profile"
on public.profiles for select
using (
  user_id = auth.uid() or
  exists (
    select 1
    from public.workspace_members wm
    where wm.user_id = public.profiles.user_id
      and public.is_workspace_member(wm.workspace_id)
  )
);

create policy "users can update own profile"
on public.profiles for update
using (user_id = auth.uid());

create policy "users can insert own profile"
on public.profiles for insert
with check (user_id = auth.uid());

-- workspaces Policies
create policy "members can read workspace"
on public.workspaces for select
using (public.is_workspace_member(id));

create policy "authenticated users can create workspace"
on public.workspaces for insert
with check (owner_id = auth.uid());

create policy "owner can update workspace"
on public.workspaces for update
using (public.has_workspace_role(id, array['owner']));

create policy "owner can delete workspace"
on public.workspaces for delete
using (public.has_workspace_role(id, array['owner']));

-- workspace_members Policies
create policy "members can read workspace members"
on public.workspace_members for select
using (public.is_workspace_member(workspace_id));

create policy "owner manager can insert workspace members"
on public.workspace_members for insert
with check (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner manager can update workspace members"
on public.workspace_members for update
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner can delete workspace members"
on public.workspace_members for delete
using (public.has_workspace_role(workspace_id, array['owner']));

-- projects Policies
create policy "workspace members can read projects"
on public.projects for select
using (public.is_workspace_member(workspace_id));

create policy "owner manager can insert projects"
on public.projects for insert
with check (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner manager can update projects"
on public.projects for update
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner can delete projects"
on public.projects for delete
using (public.has_workspace_role(workspace_id, array['owner']));

-- project_members Policies
create policy "workspace members can read project members"
on public.project_members for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and public.is_workspace_member(p.workspace_id)
  )
);

create policy "owner manager can insert project members"
on public.project_members for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and public.has_workspace_role(p.workspace_id, array['owner', 'manager'])
  )
);

create policy "owner manager can update project members"
on public.project_members for update
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and public.has_workspace_role(p.workspace_id, array['owner', 'manager'])
  )
);

create policy "owner manager can delete project members"
on public.project_members for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and public.has_workspace_role(p.workspace_id, array['owner', 'manager'])
  )
);

-- milestones Policies
create policy "workspace members can read milestones"
on public.milestones for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = milestones.project_id
      and public.is_workspace_member(p.workspace_id)
  )
);

create policy "owner manager can insert milestones"
on public.milestones for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = milestones.project_id
      and public.has_workspace_role(p.workspace_id, array['owner', 'manager'])
  )
);

create policy "owner manager can update milestones"
on public.milestones for update
using (
  exists (
    select 1
    from public.projects p
    where p.id = milestones.project_id
      and public.has_workspace_role(p.workspace_id, array['owner', 'manager'])
  )
);

create policy "owner manager can delete milestones"
on public.milestones for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = milestones.project_id
      and public.has_workspace_role(p.workspace_id, array['owner', 'manager'])
  )
);

-- tasks Policies
create policy "workspace members can read tasks"
on public.tasks for select
using (public.is_workspace_member(workspace_id));

create policy "owner manager member can insert tasks"
on public.tasks for insert
with check (public.has_workspace_role(workspace_id, array['owner', 'manager', 'member']));

create policy "owner manager member can update tasks"
on public.tasks for update
using (public.has_workspace_role(workspace_id, array['owner', 'manager', 'member']));

create policy "owner manager can delete tasks"
on public.tasks for delete
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));

-- task_comments Policies
create policy "workspace members can read task comments"
on public.task_comments for select
using (public.can_access_task(task_id));

create policy "workspace members can insert task comments"
on public.task_comments for insert
with check (
  public.can_access_task(task_id)
  and user_id = auth.uid()
);

create policy "comment owner can update own comment"
on public.task_comments for update
using (user_id = auth.uid());

create policy "comment owner can delete own comment"
on public.task_comments for delete
using (user_id = auth.uid());

-- task_attachments Policies
create policy "workspace members can read task attachments"
on public.task_attachments for select
using (public.can_access_task(task_id));

create policy "workspace members can insert task attachments"
on public.task_attachments for insert
with check (public.can_access_task(task_id));

create policy "uploader can delete own attachment"
on public.task_attachments for delete
using (uploaded_by = auth.uid());

-- activity_logs Policies
create policy "workspace members can read activity logs"
on public.activity_logs for select
using (public.is_workspace_member(workspace_id));

create policy "workspace members can insert activity logs"
on public.activity_logs for insert
with check (public.is_workspace_member(workspace_id));

-- ai_generations Policies
create policy "workspace members can read ai generations"
on public.ai_generations for select
using (public.is_workspace_member(workspace_id));

create policy "workspace members can insert ai generations"
on public.ai_generations for insert
with check (public.is_workspace_member(workspace_id));

-- reports Policies
create policy "workspace members can read reports"
on public.reports for select
using (public.is_workspace_member(workspace_id));

create policy "owner manager can insert reports"
on public.reports for insert
with check (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner manager can update reports"
on public.reports for update
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner manager can delete reports"
on public.reports for delete
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));

-- integration_settings Policies
create policy "owner manager can read integration settings"
on public.integration_settings for select
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner manager can insert integration settings"
on public.integration_settings for insert
with check (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner manager can update integration settings"
on public.integration_settings for update
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "owner can delete integration settings"
on public.integration_settings for delete
using (public.has_workspace_role(workspace_id, array['owner']));

-- notification_logs Policies
create policy "owner manager can read notification logs"
on public.notification_logs for select
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));

create policy "workspace members can insert notification logs"
on public.notification_logs for insert
with check (public.is_workspace_member(workspace_id));

create policy "owner manager can update notification logs"
on public.notification_logs for update
using (public.has_workspace_role(workspace_id, array['owner', 'manager']));
